import { useState, useEffect } from 'react';

interface InterviewDataType {
  interviewId: string;
  questions: Array<{ idPregunta: string; pregunta: string }>;
  interviewDetails: {
    descripcionVacante: string;
    empresa: string;
    perfilEmpresa: string;
    candidateName?: string;
  };
}

interface Message {
  type: 'user' | 'assistant';
  text: string;
  time: string;
}

export function useInterviewChat(
  interviewData: InterviewDataType,
  sessionData: any,
  streamingToken: string
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewFinished, setInterviewFinished] = useState(false);
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  const [chatHistory, setChatHistory] = useState<any>(null);

  // Cargar historial al inicio
  useEffect(() => {
    const loadedHistory = loadChatHistory();
    if (loadedHistory) {
      setChatHistory(loadedHistory);
      restoreFromCache(loadedHistory);
    }
  }, []);

  // Inicializar entrevista
  useEffect(() => {
    if (sessionData?.sessionId && messages.length === 0) {
      if (chatHistory) {
        // Si hay historial, continuar desde el último mensaje
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.type === 'user') {
          processNextQuestion();
        } else {
          speakText("Continuemos con tu entrevista. La última pregunta fue: " + lastMessage.text);
        }
      } else {
        // Si no hay historial, iniciar con intro
        initializeInterview();
      }
    }
  }, [sessionData, messages.length]);

  const initializeInterview = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/chats/v1/generate-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: interviewData.interviewDetails.candidateName || 'Candidato',
          jobTitle: interviewData.interviewDetails.perfilEmpresa,
          companyName: interviewData.interviewDetails.empresa,
        }),
      });
      const data = await response.json();
      addMessage('assistant', data.response);
      await speakText(data.response);
    } catch (error) {
      console.error('Error initializing interview:', error);
    }
  };

  const processNextQuestion = async () => {
    if (currentQuestionIndex >= interviewData.questions.length) {
      setInterviewFinished(true);
      const closeMessage = 'Gracias por participar en esta entrevista. Has completado todas las preguntas.';
      addMessage('assistant', closeMessage);
      await speakText(closeMessage);
      return;
    }

    const nextQuestion = interviewData.questions[currentQuestionIndex].pregunta;
    const lastUserMessage = messages.findLast(m => m.type === 'user')?.text || '';
    const lastAssistantMessage = messages.findLast(m => m.type === 'assistant')?.text || '';

    try {
      const response = await fetch('http://localhost:3001/api/chats/v1/process-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentQuestion: nextQuestion,
          lastUserResponse: lastUserMessage,
          lastAssistantResponse: lastAssistantMessage,
          candidateName: interviewData.interviewDetails.candidateName || 'Candidato',
          jobTitle: interviewData.interviewDetails.perfilEmpresa,
          companyName: interviewData.interviewDetails.empresa,
        }),
      });
      const data = await response.json();
      addMessage('assistant', data.response);
      await speakText(data.response);
      setCurrentQuestionIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error processing question:', error);
    }
  };

  const processUserResponse = async (userResponse: string) => {
    if (!userResponse.trim() || isProcessing) return;
    setIsProcessing(true);
    
    try {
      addMessage('user', userResponse);
      setIsFirstInteraction(false);
      await processNextQuestion();
      saveChatHistory();
    } catch (error) {
      console.error('Error processing user response:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Funciones auxiliares
  const addMessage = (type: 'user' | 'assistant', text: string) => {
    const newMessage = {
      type,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const saveChatHistory = () => {
    const historyData = {
      messages,
      currentQuestionIndex,
      interviewFinished,
    };
    localStorage.setItem('chatHistory', JSON.stringify(historyData));
  };

  const loadChatHistory = () => {
    const saved = localStorage.getItem('chatHistory');
    return saved ? JSON.parse(saved) : null;
  };

  const restoreFromCache = (cache: any) => {
    setMessages(cache.messages || []);
    setCurrentQuestionIndex(cache.currentQuestionIndex || 0);
    setInterviewFinished(cache.interviewFinished || false);
    setIsFirstInteraction(false);
  };

  const speakText = async (text: string) => {
    if (!sessionData?.sessionId) return;
    try {
      const response = await fetch('https://api.heygen.com/v1/streaming.task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${streamingToken}`,
        },
        body: JSON.stringify({
          session_id: sessionData.sessionId,
          text,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to speak question');
      }
    } catch (error) {
      console.error('Error in speakQuestion:', error);
    }
  };

  return { 
    messages, 
    isProcessing, 
    processUserResponse, 
    interviewFinished,
    isFirstInteraction 
  };
}