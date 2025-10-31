import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Check, AlertTriangle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import MasterChat from '@/components/MasterChat';
import { toast } from 'sonner';

interface QuizOption {
  text: string;
  correct: boolean;
  explanation: string;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
  type?: 'multiple-choice' | 'assertion-reason' | 'true-false';
}

interface QuizData {
  questions: QuizQuestion[];
  title?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  creator_name?: string;
}

interface QuizDisplayProps {
  quiz: QuizData;
  onReset: () => void;
  username?: string;
  onScoreSubmit?: (score: number, totalQuestions: number, quizResult: any) => void;
  creatorName?: string;
}

const QuizDisplay = ({ quiz, onReset, username, onScoreSubmit, creatorName }: QuizDisplayProps) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showMasterChat, setShowMasterChat] = useState(false);
  const [earnedLearnPoint, setEarnedLearnPoint] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>(quiz.difficulty || 'medium');
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    setSelectedAnswers({});
    setScore(null);
    setShowExplanation({});
    setScoreSubmitted(false);
    setShowMasterChat(false);
    setEarnedLearnPoint(false);
  }, [quiz]);

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    if (score !== null) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const toggleExplanation = (questionIndex: number) => {
    setShowExplanation(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex]
    }));
  };

  const submitQuiz = () => {
    if (Object.keys(selectedAnswers).length < quiz.questions.length) {
      return;
    }
    
    let correctCount = 0;
    quiz.questions.forEach((q, index) => {
      if (q.options[selectedAnswers[index]]?.correct) {
        correctCount++;
      }
    });
    
    setScore(correctCount);

    if (isExternalQuiz && !earnedLearnPoint) {
      setEarnedLearnPoint(true);
      toast.success("You earned 1 Learn Point!", {
        description: "Playing assessments created by others helps you earn Learn Points!"
      });
    }
    
    if (username && onScoreSubmit) {
      const quizResult = getQuizContext();
      onScoreSubmit(correctCount, quiz.questions.length, quizResult);
      setScoreSubmitted(true);
    }
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setScore(null);
    setShowExplanation({});
    setScoreSubmitted(false);
    setShowMasterChat(false);
  };

  const getScoreMessage = () => {
    const percentage = (score! / quiz.questions.length) * 100;
    if (percentage === 100) return "Perfect score! Excellent work!";
    if (percentage >= 80) return "Great job! You've mastered this topic!";
    if (percentage >= 60) return "Good effort! Keep learning!";
    if (percentage >= 40) return "Nice try! Review the explanations to improve!";
    return "Keep practicing! Review the material and try again!";
  };

  const handleSubmitScore = () => {
    if (score !== null && onScoreSubmit && !scoreSubmitted) {
      const quizResult = getQuizContext();
      onScoreSubmit(score, quiz.questions.length, quizResult);
      setScoreSubmitted(true);
    }
  };

  const getQuizContext = () => {
    const questionsWithAnswers = quiz.questions.map((q, qIndex) => {
      const selectedOption = selectedAnswers[qIndex];
      const isCorrect = selectedOption !== undefined ? q.options[selectedOption]?.correct : false;
      return {
        questionNumber: qIndex + 1,
        question: q.question,
        questionType: q.type || 'multiple-choice',
        userAnswer: selectedOption !== undefined ? q.options[selectedOption]?.text || "Not answered" : "Not answered",
        correctAnswer: q.options.find(opt => opt.correct)?.text || "",
        isCorrect,
        explanation: q.options.find(opt => opt.correct)?.explanation || ""
      };
    });
    
    return {
      totalQuestions: quiz.questions.length,
      score: score,
      questions: questionsWithAnswers,
      title: quiz.title,
      difficulty: quiz.difficulty,
      topic: quiz.topic
    };
  };

  const getQuizTopic = () => {
    if (quiz.topic) {
      return quiz.topic;
    } else if (quiz.title) {
      return quiz.title;
    } else if (quiz.questions && quiz.questions.length > 0) {
      return quiz.questions[0].question;
    }
    return '';
  };

  const getQuestionTypeLabel = (type?: string) => {
    switch (type) {
      case 'assertion-reason':
        return <span className="text-indigo-600 text-xs font-semibold bg-indigo-50 px-2 py-1 rounded-full mr-2">Assertion-Reason</span>;
      case 'true-false':
        return <span className="text-green-600 text-xs font-semibold bg-green-50 px-2 py-1 rounded-full mr-2">True-False</span>;
      case 'multiple-choice':
      default:
        return <span className="text-blue-600 text-xs font-semibold bg-blue-50 px-2 py-1 rounded-full mr-2">Multiple-Choice</span>;
    }
  };

  const isExternalQuiz = username && creatorName && username !== creatorName;

  return (
    <motion.div 
      className="premium-card overflow-visible"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 sm:p-8">
        {username && (
          <div className="mb-4 py-2 px-4 bg-blue-50 rounded-lg text-gray-700 inline-block">
            Taking assessment as: <span className="font-semibold">{username}</span>
          </div>
        )}
        
        {isExternalQuiz && (
          <div className="mb-4 py-2 px-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-center">
            <Star className="text-amber-500 mr-2 h-5 w-5" />
            <div>
              <p className="font-medium">External Assessment</p>
              <p className="text-sm">Created by: {creatorName}</p>
              {!scoreSubmitted && <p className="text-xs text-green-600 mt-1">Complete this assessment to earn 1 Learn Point</p>}
            </div>
          </div>
        )}
        
        <h2 className="text-2xl font-bold mb-6 gradient-text">
          {quiz.title || "Your Assessment"}
          {quiz.difficulty && <span className="ml-2 text-sm font-medium text-gray-500">({quiz.difficulty} difficulty)</span>}
        </h2>
        
        {quiz.description && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg text-gray-700 text-sm">
            {quiz.description}
          </div>
        )}
        
        {!quizStarted ? (
          <div className="p-6 bg-white rounded-xl shadow-md mb-6">
            <h3 className="text-xl font-semibold mb-4">Select Difficulty Level</h3>
            <p className="text-gray-600 mb-4">Choose the difficulty level for this assessment:</p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <Button 
                variant={selectedDifficulty === 'easy' ? 'default' : 'outline'}
                onClick={() => setSelectedDifficulty('easy')}
                className={selectedDifficulty === 'easy' ? 'bg-green-600' : ''}
              >
                Easy
              </Button>
              <Button 
                variant={selectedDifficulty === 'medium' ? 'default' : 'outline'}
                onClick={() => setSelectedDifficulty('medium')}
                className={selectedDifficulty === 'medium' ? 'bg-blue-600' : ''}
              >
                Medium
              </Button>
              <Button 
                variant={selectedDifficulty === 'hard' ? 'default' : 'outline'}
                onClick={() => setSelectedDifficulty('hard')}
                className={selectedDifficulty === 'hard' ? 'bg-red-600' : ''}
              >
                Hard
              </Button>
            </div>
            
            <Button 
              onClick={() => setQuizStarted(true)}
              className="w-full"
            >
              Start Assessment
            </Button>
          </div>
        ) : !showMasterChat ? (
          <>
            <div className="space-y-8">
              {quiz.questions.map((question, qIndex) => (
                <motion.div 
                  key={qIndex}
                  className="p-4 sm:p-6 bg-gray-50 rounded-xl border border-gray-100 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: qIndex * 0.1 }}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    {getQuestionTypeLabel(question.type)}
                    <span>{qIndex + 1}. {question.question}</span>
                  </h3>
                  
                  <div className="space-y-3 mb-3">
                    {question.options.map((option, oIndex) => (
                      <motion.div 
                        key={oIndex}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer transition-all",
                          selectedAnswers[qIndex] === oIndex && score === null 
                            ? "border-quiz-primary bg-blue-50" 
                            : "border-gray-200 hover:border-quiz-primary",
                          score !== null && option.correct && "border-green-500 bg-green-50",
                          score !== null && selectedAnswers[qIndex] === oIndex && !option.correct && "border-red-500 bg-red-50"
                        )}
                        onClick={() => handleAnswerSelect(qIndex, oIndex)}
                        whileHover={{ scale: score === null ? 1.01 : 1 }}
                        whileTap={{ scale: score === null ? 0.99 : 1 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 border",
                            selectedAnswers[qIndex] === oIndex && score === null 
                              ? "border-quiz-primary bg-quiz-primary text-white" 
                              : "border-gray-300",
                            score !== null && option.correct && "border-green-500 bg-green-500 text-white",
                            score !== null && selectedAnswers[qIndex] === oIndex && !option.correct && "border-red-500 bg-red-500 text-white"
                          )}>
                            {selectedAnswers[qIndex] === oIndex && score === null && <Check size={14} />}
                            {score !== null && option.correct && <Check size={14} />}
                            {score !== null && selectedAnswers[qIndex] === oIndex && !option.correct && <AlertTriangle size={14} />}
                          </div>
                          
                          <div>
                            <p className={cn(
                              "text-gray-800",
                              score !== null && option.correct && "font-medium text-green-700",
                              score !== null && selectedAnswers[qIndex] === oIndex && !option.correct && "font-medium text-red-700"
                            )}>
                              {option.text}
                            </p>
                            
                            {score !== null && selectedAnswers[qIndex] === oIndex && option.correct && (
                              <div className="mt-2 text-sm text-green-700 flex items-center">
                                <Check size={14} className="mr-1" /> Correct!
                              </div>
                            )}
                            
                            {score !== null && selectedAnswers[qIndex] === oIndex && !option.correct && (
                              <div className="mt-2 text-sm text-red-700 flex items-center">
                                <AlertTriangle size={14} className="mr-1" /> Incorrect
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {score !== null && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExplanation(qIndex)}
                        className="text-sm"
                      >
                        {showExplanation[qIndex] ? 'Hide Explanation' : 'Show Explanation'}
                      </Button>
                      
                      <AnimatePresence>
                        {showExplanation[qIndex] && (
                          <motion.div 
                            className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-gray-700"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {question.options.find(opt => opt.correct)?.explanation || "No explanation available."}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8">
              {score === null ? (
                <div className="flex flex-col md:flex-row gap-4 mt-6">
                  <Button 
                    className="premium-button flex-1 py-6"
                    onClick={submitQuiz}
                    disabled={Object.keys(selectedAnswers).length < quiz.questions.length}
                  >
                    Submit Quiz
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex-1 py-6"
                    onClick={onReset}
                  >
                    Exit Quiz
                  </Button>
                </div>
              ) : (
                <motion.div 
                  className="p-6 bg-white rounded-xl shadow-md border-t-4 border-quiz-primary mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex flex-col md:flex-row items-center mb-6">
                    <div className="md:mr-6 mb-4 md:mb-0 flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white text-3xl font-bold">
                      {score}/{quiz.questions.length}
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold mb-2 flex items-center">
                        <Trophy className="text-yellow-500 mr-2" size={24} />
                        {getScoreMessage()}
                      </h3>
                      
                      <p className="text-gray-600">
                        You got {score} out of {quiz.questions.length} questions correct 
                        ({Math.round((score / quiz.questions.length) * 100)}%).
                      </p>
                      
                      {!scoreSubmitted && username && onScoreSubmit && (
                        <Button
                          variant="outline"
                          className="mt-2"
                          onClick={handleSubmitScore}
                        >
                          Save Score
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      className="flex-1"
                      onClick={resetQuiz}
                    >
                      Retry Quiz
                    </Button>
                    
                    <Button
                      className="flex-1"
                      onClick={() => setShowMasterChat(true)}
                    >
                      Get Help from Master Teacher
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={onReset}
                    >
                      Exit Quiz
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </>
        ) : (
          <div className="h-[600px]">
            <MasterChat topic={getQuizTopic()} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default QuizDisplay;
