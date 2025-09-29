import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Upload, Button, Form, Input, message, Space } from 'antd';
import { InboxOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { setCurrentCandidate, addCandidate, setInterviewState } from '../store/interviewSlice';
import { parseResume } from '../utils/resumeParser';
import Chat from './Chat';

const { Dragger } = Upload;

const IntervieweeTab = () => {
  const dispatch = useDispatch();
  const { currentCandidate, interviewState } = useSelector(state => state.interview);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = async (file) => {
    setLoading(true);
    try {
      const parsedData = await parseResume(file);
      const candidateData = {
        id: uuidv4(),
        name: parsedData.name || '',
        email: parsedData.email || '',
        phone: parsedData.phone || '',
        resumeText: parsedData.text || '',
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      setUploadedFile(file);
      dispatch(setCurrentCandidate(candidateData));
      
      form.setFieldsValue({
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone
      });

      message.success('Resume uploaded successfully!');
    } catch (error) {
      message.error('Error parsing resume. Please try again.');
    }
    setLoading(false);
    return false;
  };

  const handleFormSubmit = (values) => {
    const candidateData = {
      ...currentCandidate,
      ...values,
      status: 'ready'
    };
    
    dispatch(setCurrentCandidate(candidateData));
    dispatch(addCandidate(candidateData));
    dispatch(setInterviewState('ready'));
    message.success('Profile completed! Ready to start interview.');
  };

  const beforeUpload = (file) => {
    const isValidType = file.type === 'application/pdf' || 
                       file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (!isValidType) {
      message.error('Please upload PDF or DOCX files only!');
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('File must be smaller than 10MB!');
      return false;
    }

    handleFileUpload(file);
    return false;
  };

  if (interviewState === 'ready' || interviewState === 'in-progress' || interviewState === 'completed') {
    return <Chat />;
  }

  return (
    <div className="interviewee-container">
      <Card 
        title={<Space><UserOutlined />Welcome to Your Interview</Space>}
        className="upload-card"
      >
        <div className="upload-section">
          <Dragger
            name="resume"
            multiple={false}
            beforeUpload={beforeUpload}
            showUploadList={false}
            className="resume-uploader"
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Click or drag your resume here</p>
            <p className="ant-upload-hint">Support PDF and DOCX formats only (Max 10MB)</p>
          </Dragger>

          {uploadedFile && (
            <div className="uploaded-file-info">
              <p>✓ Uploaded: {uploadedFile.name}</p>
            </div>
          )}
        </div>

        {currentCandidate && (
          <Card title="Complete Your Profile" className="profile-form-card" loading={loading}>
            <Form form={form} layout="vertical" onFinish={handleFormSubmit} requiredMark={false}>
              <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter your name' }]}>
                <Input placeholder="Enter your full name" size="large" />
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Please enter a valid email' }]}>
                <Input placeholder="Enter your email address" size="large" />
              </Form.Item>
              <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: 'Please enter your phone number' }]}>
                <Input placeholder="Enter your phone number" size="large" />
              </Form.Item>
              <Button type="primary" htmlType="submit" size="large" block icon={<RobotOutlined />}>
                Start AI Interview
              </Button>
            </Form>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default IntervieweeTab;
