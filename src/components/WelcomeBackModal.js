import React from 'react';
import { Modal, Button, Typography, Space } from 'antd';
import { RobotOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { resetInterview } from '../store/interviewSlice';

const { Title, Text } = Typography;

const WelcomeBackModal = ({ visible, onClose }) => {
  const dispatch = useDispatch();

  const handleContinue = () => {
    onClose(); // Just close the modal, the state is already correct
  };

  const handleStartOver = () => {
    dispatch(resetInterview());
    onClose();
  };

  return (
    <Modal title={<Space><RobotOutlined />Welcome Back!</Space>} open={visible} onCancel={onClose} footer={[<Button key="startover" onClick={handleStartOver}>Start New Interview</Button>,<Button key="continue" type="primary" icon={<PlayCircleOutlined />} onClick={handleContinue}>Continue</Button>]} centered>
      <div className="welcome-back-content">
        <Title level={4}>Your session was restored!</Title>
        <Text>You can continue where you left off or start a new interview.</Text>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;
