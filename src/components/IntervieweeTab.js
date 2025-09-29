

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Upload, Button, Form, Input, message, Space } from 'antd';
import { InboxOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import {
  setCurrentCandidate,
  addCandidate,
  setInterviewState
} from '../store/interviewSlice';
import { parseResume } from '../utils/resumeParser';
import Chat from './Chat';

const { Dragger } = Upload;

const IntervieweeTab = () => {
  const dispatch = useDispatch();
  const { currentCandidate, interviewState } = useSelector(state => state.interview);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Handle file upload and parse resume via serverless API
  const handleFileUpload = async file => {
    setLoading(true);
    try {
      // parseResume calls /api/parseResume under the hood
      const parsed = await parseResume(file);
      const candidateData = {
        id: uuidv4(),
        name: parsed.name || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        resumeText: parsed.text || '',
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      setUploadedFile(file);
      dispatch(setCurrentCandidate(candidateData));

      // Pre-fill the form fields
      form.setFieldsValue({
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone
      });

      message.success('Resume parsed successfully!');
    } catch (error) {
      console.error('Error parsing resume:', error);
      message.error('Failed to parse resume. Please try again.');
    }
    setLoading(false);
    return false; // Prevent default upload
  };

  // Validate and intercept upload
  const beforeUpload = file => {
    const isPdf = file.type === 'application/pdf';
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (!isPdf && !isDocx) {
      message.error('Only PDF or DOCX files are allowed.');
      return false;
    }
    if (file.size / 1024 / 1024 > 10) {
      message.error('File must be smaller than 10MB.');
      return false;
    }
    handleFileUpload(file);
    return false;
  };

  // Submit profile form and start interview
  const handleFormSubmit = values => {
    const updated = {
      ...currentCandidate,
      ...values,
      status: 'ready'
    };
    dispatch(setCurrentCandidate(updated));
    dispatch(addCandidate(updated));
    dispatch(setInterviewState('ready'));
    message.success('Profile completed! Starting interview...');
  };

  // Render Chat once interview starts or completes
  if (['ready', 'in-progress', 'completed'].includes(interviewState)) {
    return <Chat />;
  }

  return (
    <div className="interviewee-container">
      <Card
        title={
          <Space>
            <UserOutlined />
            Welcome to Your AI Interview
          </Space>
        }
        className="upload-card"
      >
        {/* Resume Uploader */}
        <div className="upload-section">
          <Dragger
            name="resume"
            beforeUpload={beforeUpload}
            showUploadList={false}
            className="resume-uploader"
            disabled={loading}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag your resume here</p>
            <p className="ant-upload-hint">PDF or DOCX only, max 10MB</p>
          </Dragger>

          {uploadedFile && (
            <div className="uploaded-file-info">
              <p>✓ Uploaded: {uploadedFile.name}</p>
            </div>
          )}
        </div>

        {/* Profile Form */}
        {currentCandidate && (
          <Card
            title="Complete Your Profile"
            className="profile-form-card"
            loading={loading}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFormSubmit}
              requiredMark={false}
            >
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input placeholder="Your full name" size="large" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Enter a valid email' }
                ]}
              >
                <Input placeholder="Your email" size="large" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter your phone number' }]}
              >
                <Input placeholder="Your phone number" size="large" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  icon={<RobotOutlined />}
                >
                  Start AI Interview
                </Button>
              </Form.Item>
            </Form>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default IntervieweeTab;
