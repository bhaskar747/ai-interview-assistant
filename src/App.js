import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tabs, Layout } from 'antd';
import { UserOutlined, DashboardOutlined } from '@ant-design/icons';
import IntervieweeTab from './components/IntervieweeTab';
import InterviewerDashboard from './components/InterviewerDashboard';
import { setActiveTab } from './store/interviewSlice';
import './App.css';

const { Content } = Layout;

function App() {
  const dispatch = useDispatch();
  const { activeTab } = useSelector(state => state.interview);

  const tabItems = [
    {
      key: 'interviewee',
      label: <span><UserOutlined />Interviewee</span>,
      children: <IntervieweeTab />
    },
    {
      key: 'interviewer',
      label: <span><DashboardOutlined />Interviewer Dashboard</span>,
      children: <InterviewerDashboard />
    }
  ];

  return (
    <Layout className="app-layout">
      <Content className="app-content">
        <div className="app-header">
          <h1>AI Interview Assistant</h1>
          <p>Powered by Advanced AI Technology</p>
        </div>
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={(key) => dispatch(setActiveTab(key))}
          size="large"
          centered
        />
      </Content>
    </Layout>
  );
}

export default App;
