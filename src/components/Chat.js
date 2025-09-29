// src/components/Chat.js
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Input, Button, Progress, Typography, Space, Avatar, Result, Spin, Row, Col } from 'antd';
import { RobotOutlined, UserOutlined, SendOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { 
  startNewInterview,
  addQuestionAndAnswer,
  setTimer,
  setTimerRunning,
  setProcessing,
  completeInterview,
  updateCandidate,
  resetInterview,
  setActiveTab
} from '../store/interviewSlice';
import { generateQuestion, evaluateAnswer, clearInterviewData } from '../utils/aiService';

const { TextArea } = Input;
const { Title, Text } = Typography;

const Chat = () => {
  const dispatch = useDispatch();
  const { 
    currentCandidate, 
    currentQuestionIndex, 
    questions,
    answers,
    individualScores,
    timer, 
    isTimerRunning,
    interviewState,
    isProcessing,
    finalScore,
    finalSummary
  } = useSelector(state => state.interview);

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

  const TOTAL_QUESTIONS = 6;
  const questionSettings = [
    { difficulty: 'Easy', time: 20 },
    { difficulty: 'Easy', time: 20 },
    { difficulty: 'Medium', time: 60 },
    { difficulty: 'Medium', time: 60 },
    { difficulty: 'Hard', time: 120 },
    { difficulty: 'Hard', time: 120 }
  ];

  useEffect(() => {
    if (interviewState === 'ready') {
      clearInterviewData();
      initializeInterview();
    }
  }, [interviewState]);

  useEffect(() => {
    if (interviewState === 'in-progress' && currentQuestionIndex < TOTAL_QUESTIONS && questions.length === currentQuestionIndex) {
      askQuestion();
    } else if (currentQuestionIndex >= TOTAL_QUESTIONS && answers.length === TOTAL_QUESTIONS) {
      finalizeInterview();
    }
  }, [currentQuestionIndex, interviewState]);

  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      timerRef.current = setInterval(() => {
        dispatch(setTimer(timer - 1));
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      handleTimeUp();
    }
    return () => clearInterval(timerRef.current);
  }, [timer, isTimerRunning]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const initializeInterview = () => {
    dispatch(startNewInterview());
    const welcomeMessage = {
      type: 'bot',
      content: `Hello ${currentCandidate.name}! Welcome to your Full Stack Developer interview. You'll be asked ${TOTAL_QUESTIONS} questions with different difficulty levels. Your final results will be available at the end. Let's begin!`,
      timestamp: new Date().toISOString()
    };
    setChatMessages([welcomeMessage]);
  };

  const askQuestion = async () => {
    dispatch(setProcessing(true));
    
    try {
      const setting = questionSettings[currentQuestionIndex];
      const questionData = await generateQuestion(setting.difficulty, currentCandidate.resumeText);
      
      const questionMessage = {
        type: 'bot',
        content: `Question ${currentQuestionIndex + 1}/${TOTAL_QUESTIONS}: ${questionData.question}`,
        timestamp: new Date().toISOString(),
        difficulty: setting.difficulty,
        timeLimit: setting.time
      };

      setChatMessages(prev => [...prev, questionMessage]);
      dispatch(setTimer(setting.time));
      dispatch(setTimerRunning(true));
    } catch (error) {
      console.error('Error generating question:', error);
    }
    
    dispatch(setProcessing(false));
  };

  const handleSubmitAnswer = async () => {
    dispatch(setTimerRunning(false));
    clearInterval(timerRef.current);
    
    const answerText = currentAnswer.trim() || 'No answer provided';
    const answerMessage = {
      type: 'user',
      content: answerText,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, answerMessage]);
    setCurrentAnswer('');
    dispatch(setProcessing(true));
    
    const acknowledgmentMessage = {
      type: 'bot',
      content: `Thank you for your answer. ${currentQuestionIndex < TOTAL_QUESTIONS - 1 ? "Let's move to the next question." : "That's the final question!"}`,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, acknowledgmentMessage]);

    try {
      const currentQ = questions[currentQuestionIndex];
      const evaluation = await evaluateAnswer(currentQ?.question || '', answerText, questionSettings[currentQuestionIndex].difficulty);
      
      dispatch(addQuestionAndAnswer({
        question: { question: currentQ?.question || '', difficulty: questionSettings[currentQuestionIndex].difficulty },
        answer: answerText,
        score: evaluation.score
      }));
      
    } catch (error) {
      console.error('Error evaluating answer:', error);
      dispatch(addQuestionAndAnswer({
        question: { question: questions[currentQuestionIndex]?.question || '', difficulty: questionSettings[currentQuestionIndex].difficulty },
        answer: answerText,
        score: 0
      }));
    }
    
    dispatch(setProcessing(false));
  };

  const handleTimeUp = () => {
    const timeUpMessage = {
      type: 'bot',
      content: 'Time is up! Moving to the next question.',
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, timeUpMessage]);
    handleSubmitAnswer();
  };

  const finalizeInterview = async () => {
    const completionMessage = {
      type: 'bot',
      content: 'Congratulations! You have completed the interview. Calculating your final results...',
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, completionMessage]);
    
    setTimeout(() => {
      const totalScore = individualScores.reduce((acc, score) => acc + score, 0);
      const finalPercentage = Math.round((totalScore / (TOTAL_QUESTIONS * 10)) * 100);
      
      const strongAreas = individualScores.filter(s => s >= 7).length;
      const weakAreas = individualScores.filter(s => s < 5).length;
      
      const summary = `Interview completed with ${finalPercentage}% score. Strong areas: ${strongAreas} questions. Areas for improvement: ${weakAreas} questions.`;
      
      dispatch(completeInterview({ score: finalPercentage, summary }));
      
      const updatedCandidate = {
        ...currentCandidate,
        score: finalPercentage,
        summary,
        status: 'completed',
        completedAt: new Date().toISOString(),
        questions: questions.map(q => q.question),
        answers: answers,
        individualScores
      };
      dispatch(updateCandidate(updatedCandidate));
      
      const finalMessage = {
        type: 'bot',
        content: `Your final score is ${finalPercentage}/100. You can view detailed results in the Interviewer Dashboard. Thank you for your time!`,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, finalMessage]);
    }, 3000);
  };

  if (interviewState === 'completed') {
    return (
      <div className="interview-completed-container">
        <Result
          status="success"
          title="Interview Completed Successfully!"
          subTitle={`Final Score: ${finalScore}/100`}
          extra={[
            <Button type="primary" key="dashboard" onClick={() => dispatch(setActiveTab('interviewer'))}>
              View Detailed Results
            </Button>,
            <Button key="new" onClick={() => dispatch(resetInterview())}>
              Start New Interview
            </Button>
          ]}
          style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '40px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }}
        />
      </div>
    );
  }

  return (
    <div className="interview-main-container">
      <Row justify="center" style={{ minHeight: '85vh' }}>
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          <Card className="interview-chat-card">
            {/* Header Section */}
            <div className="interview-header-section">
              <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
                <Col>
                  <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                    Interview in Progress
                  </Title>
                  <Text type="secondary" style={{ fontSize: '1rem' }}>
                    Question {Math.min(currentQuestionIndex + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
                  </Text>
                </Col>
                
                {isTimerRunning && (
                  <Col>
                    <div className="timer-container">
                      <Space>
                        <ClockCircleOutlined style={{ fontSize: '1.2rem', color: timer <= 10 ? '#ff4d4f' : '#1890ff' }} />
                        <Text strong style={{ 
                          fontSize: '1.2rem',
                          color: timer <= 10 ? '#ff4d4f' : '#1890ff',
                          animation: timer <= 10 ? 'pulse 1s infinite' : 'none'
                        }}>
                          {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                        </Text>
                      </Space>
                    </div>
                  </Col>
                )}
              </Row>
              
              <Progress 
                percent={Math.round((currentQuestionIndex / TOTAL_QUESTIONS) * 100)} 
                strokeColor={{
                  '0%': '#1890ff',
                  '100%': '#52c41a',
                }}
                trailColor="rgba(24, 144, 255, 0.1)"
                strokeWidth={8}
                showInfo={false}
                style={{ marginBottom: '0' }}
              />
            </div>

            {/* Chat Messages Section */}
            <div className="chat-messages-container">
              <div className="chat-messages-scroll">
                {chatMessages.map((message, index) => (
                  <div key={`${index}-${message.timestamp}`} className={`chat-message ${message.type}-message`}>
                    <div className="message-avatar-container">
                      <Avatar 
                        size={48}
                        icon={message.type === 'bot' ? <RobotOutlined /> : <UserOutlined />}
                        style={{ 
                          backgroundColor: message.type === 'bot' ? '#1890ff' : '#52c41a',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      />
                    </div>
                    
                    <div className="message-content-container">
                      <div className={`message-bubble ${message.difficulty ? `difficulty-${message.difficulty.toLowerCase()}` : ''}`}>
                        <div className="message-text">
                          {message.content}
                        </div>
                        
                        {message.difficulty && (
                          <div className="question-metadata">
                            <Space size="middle">
                              <Text type="secondary" size="small">
                                <strong>Difficulty:</strong> {message.difficulty}
                              </Text>
                              <Text type="secondary" size="small">
                                <strong>Time:</strong> {message.timeLimit}s
                              </Text>
                            </Space>
                          </div>
                        )}
                      </div>
                      
                      <div className="message-timestamp">
                        <Text type="secondary" size="small">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Text>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="chat-message bot-message">
                    <div className="message-avatar-container">
                      <Avatar 
                        size={48}
                        icon={<RobotOutlined />}
                        style={{ 
                          backgroundColor: '#1890ff',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      />
                    </div>
                    <div className="message-content-container">
                      <div className="message-bubble processing-bubble">
                        <Space>
                          <Spin size="small" />
                          <span>Processing your response...</span>
                        </Space>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input Section - Always at Bottom */}
            {interviewState === 'in-progress' && currentQuestionIndex < TOTAL_QUESTIONS && !isProcessing && (
              <div className="chat-input-section">
                <div className="input-container">
                  <TextArea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={4}
                    disabled={isProcessing}
                    className="answer-textarea"
                    onPressEnter={(e) => {
                      if (e.shiftKey) return;
                      e.preventDefault();
                      if (currentAnswer.trim()) handleSubmitAnswer();
                    }}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<SendOutlined />}
                    onClick={handleSubmitAnswer}
                    disabled={!currentAnswer.trim() || isProcessing}
                    className="submit-button"
                  >
                    Submit Answer
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Chat;
