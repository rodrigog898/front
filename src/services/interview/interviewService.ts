interface Message {
  type: 'user' | 'assistant';
  text: string;
}

interface InterviewData {
  descripcionVacante: string;
  empresa: string;
  estadoEntrevista: string;
  pais: string;
  perfilEmpresa: string;
  seniorityEmpresa: string;
  uuid: string;
  candidateName?: string;
}

interface Question {
  idPregunta: string;
  pregunta: string;
}

interface InterviewInitialData {
  idEntrevista: string;
  estadoEntrevista: string;
}

export class InterviewService {
  private messages: Message[] = [];
  private isFinished: boolean = false;
  private currentQuestion: string | null = null;
  private interviewData: InterviewData | null = null;
  private questions: Question[] = [];
  private currentQuestionIndex: number = 0;
  private sessionId: string | null = null;
  private token: string | null = null;

  constructor() {
  }

  async getInterviewId(username: string): Promise<string> {
    try {
      const response = await fetch(`http://localhost:8081/api/orquestador/v1/entrevistadores?username=${username}`);
      const data: InterviewInitialData = await response.json();
      
      if (data.estadoEntrevista !== 'PG') {
        throw new Error('La entrevista no está en estado pendiente');
      }

      return data.idEntrevista;
    } catch (error) {
      console.error('Error getting interview ID:', error);
      throw error;
    }
  }

  async initializeInterview(username: string) {
    try {
      // 1. Primero obtener el ID de la entrevista
      const interviewId = await this.getInterviewId(username);

      // 2. Obtener las preguntas de la entrevista (opcional por ahora)
      const questionsResponse = await fetch(`http://localhost:8082/api/administrador-entrevista/v1/preguntas/entrevistas/${interviewId}`);
      this.questions = await questionsResponse.json();

      // 3. Obtener los datos de la entrevista actual
      const response = await fetch(`http://localhost:3001/api/chats/v1/process-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentQuestion: this.questions[0]?.pregunta || "¿Podrías presentarte y contarnos sobre tu experiencia?",
          lastUserResponse: "",
          lastAssistantResponse: null,
          candidateName: "Candidato", // Podríamos obtener esto de otro endpoint si es necesario
          jobTitle: "Desarrollador",  // Esto también podría venir de otro endpoint
          companyName: "Empresa"      // Y esto
        }),
      });

      const initialQuestion = await response.json();
      this.currentQuestion = initialQuestion.response;
      
      return {
        interviewId,
        questions: this.questions,
        initialQuestion: this.currentQuestion
      };
    } catch (error) {
      console.error('Error initializing interview:', error);
      throw error;
    }
  }

  async getNextQuestion(): Promise<string | null> {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.isFinished = true;
      return null;
    }

    const question = this.questions[this.currentQuestionIndex];
    this.currentQuestion = question.pregunta;
    this.currentQuestionIndex++;

    return this.currentQuestion;
  }

  async processQuestion(lastUserResponse: string) {
    if (!this.interviewData || !this.currentQuestion) {
      throw new Error('Interview not properly initialized');
    }

    try {
      const response = await fetch('http://localhost:3001/api/chats/v1/process-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentQuestion: this.currentQuestion,
          lastUserResponse: lastUserResponse,
          lastAssistantResponse: this.getLastAssistantResponse(),
          candidateName: this.interviewData.candidateName || 'Candidato',
          jobTitle: this.interviewData.perfilEmpresa,
          companyName: this.interviewData.empresa
        }),
      });

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error processing question:', error);
      throw error;
    }
  }

  addMessage(type: 'user' | 'assistant', text: string) {
    this.messages.push({ type, text });
  }

  getMessages(): Message[] {
    return this.messages;
  }

  getLastAssistantResponse(): string | null {
    const assistantMessages = this.messages.filter(m => m.type === 'assistant');
    return assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1].text : null;
  }

  isInterviewFinished(): boolean {
    return this.isFinished;
  }

  setInterviewFinished(finished: boolean) {
    this.isFinished = finished;
  }

  async speakQuestion(question: string) {
    if (!this.sessionId || !this.token) {
      throw new Error('No active session');
    }

    try {
      const response = await fetch('https://api.heygen.com/v1/streaming.task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          text: question
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error speaking question:', error);
      throw error;
    }
  }

  setSessionData(sessionId: string, token: string) {
    this.sessionId = sessionId;
    this.token = token;
  }

  async endInterview() {
    this.isFinished = true;
    if (this.sessionId && this.token) {
      try {
        await fetch('https://api.heygen.com/v1/streaming.stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify({
            session_id: this.sessionId
          })
        });
      } catch (error) {
        console.error('Error ending interview:', error);
      }
    }
  }

  saveChatHistory() {
    if (this.messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(this.messages));
    }
  }

  loadChatHistory(): Message[] {
    const history = localStorage.getItem('chatHistory');
    if (history) {
      this.messages = JSON.parse(history);
      return this.messages;
    }
    return [];
  }

  async handleUserResponse(response: string) {
    // 1. Guardar la respuesta del usuario
    this.addMessage('user', response);

    // 2. Procesar la respuesta y obtener la siguiente pregunta
    const processedResponse = await this.processQuestion(response);
    
    // 3. Si la entrevista no ha terminado, obtener la siguiente pregunta
    if (!this.isFinished) {
      const nextQuestion = await this.getNextQuestion();
      if (nextQuestion) {
        this.addMessage('assistant', nextQuestion);
        return nextQuestion;
      }
    }

    // 4. Si la entrevista ha terminado, enviar mensaje de cierre
    return "Gracias por participar en esta entrevista. Hemos terminado con todas las preguntas.";
  }
}

export const interviewService = new InterviewService(); 