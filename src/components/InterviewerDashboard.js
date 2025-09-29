import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Table, Card, Input, Select, Button, Space, Typography, Tag, Modal, Divider } from 'antd';
import { SearchOutlined, EyeOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const InterviewerDashboard = () => {
  const { candidates } = useSelector(state => state.interview);
  const safeCandidates = Array.isArray(candidates) ? candidates : [];
  
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      ready: 'blue',
      'in-progress': 'processing',
      completed: 'success'
    };
    return colors[status] || 'default';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const filteredCandidates = safeCandidates.filter(candidate => {
    const matchesSearch = candidate.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                         candidate.email?.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (a.score && b.score) return b.score - a.score;
    if (a.score && !b.score) return -1;
    if (!a.score && b.score) return 1;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  const columns = [
    {
      title: 'Rank',
      key: 'rank',
      width: 60,
      render: (_, __, index) => (
        <div className="rank-cell">
          {index < 3 && <TrophyOutlined style={{ color: ['#ffd700', '#c0c0c0', '#cd7f32'][index] }} />}
          {index + 1}
        </div>
      )
    },
    {
      title: 'Candidate',
      key: 'candidate',
      render: (candidate) => (
        <Space>
          <UserOutlined />
          <div>
            <div><strong>{candidate.name || 'Unknown'}</strong></div>
            <Text type="secondary" size="small">{candidate.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      sorter: (a, b) => (a.score || 0) - (b.score || 0),
      render: (score) => (
        <div style={{ fontWeight: 'bold', color: getScoreColor(score) }}>
          {score ? `${score}/100` : 'Not completed'}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase() || 'PENDING'}
        </Tag>
      )
    },
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => dayjs(timestamp).format('MMM DD, YYYY HH:mm')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (candidate) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedCandidate(candidate);
            setDetailModalVisible(true);
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="dashboard-container">
      <Card className="dashboard-card">
        <div className="dashboard-header">
          <Title level={3}>
            <TrophyOutlined /> Candidate Dashboard
          </Title>
          <Text type="secondary">
            Manage and review all interview candidates
          </Text>
        </div>

        <div className="dashboard-filters">
          <Space size="middle" wrap>
            <Search
              placeholder="Search candidates..."
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="ready">Ready</Option>
              <Option value="in-progress">In Progress</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Space>
        </div>

        <div className="dashboard-stats">
          <Space size="large">
            <div className="stat-item">
              <div className="stat-number">{safeCandidates.length}</div>
              <Text>Total Candidates</Text>
            </div>
            <Divider type="vertical" />
            <div className="stat-item">
              <div className="stat-number">
                {safeCandidates.filter(c => c.status === 'completed').length}
              </div>
              <Text>Completed</Text>
            </div>
            <Divider type="vertical" />
            <div className="stat-item">
              <div className="stat-number">
                {safeCandidates.filter(c => c.status === 'in-progress').length}
              </div>
              <Text>In Progress</Text>
            </div>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={sortedCandidates}
          rowKey="id"
          pagination={{
            total: sortedCandidates.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} candidates`
          }}
          className="candidates-table"
        />

        <Modal
          title={`${selectedCandidate?.name} - Interview Details`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={800}
          footer={null}
        >
          {selectedCandidate && (
            <div className="candidate-detail">
              <Card size="small" className="profile-card">
                <Title level={4}>Profile Information</Title>
                <div className="profile-info">
                  <Text strong>Name: </Text><Text>{selectedCandidate.name}</Text><br/>
                  <Text strong>Email: </Text><Text>{selectedCandidate.email}</Text><br/>
                  <Text strong>Phone: </Text><Text>{selectedCandidate.phone}</Text><br/>
                  <Text strong>Status: </Text>
                  <Tag color={getStatusColor(selectedCandidate.status)}>
                    {selectedCandidate.status?.toUpperCase()}
                  </Tag><br/>
                  <Text strong>Interview Date: </Text>
                  <Text>{dayjs(selectedCandidate.timestamp).format('MMMM DD, YYYY at HH:mm')}</Text>
                </div>
              </Card>

              {selectedCandidate.score && (
                <Card size="small" className="score-card">
                  <Title level={4}>Final Results</Title>
                  <div className="score-display">
                    <div className="score-number" style={{ color: getScoreColor(selectedCandidate.score) }}>
                      {selectedCandidate.score}/100
                    </div>
                    <Text type="secondary">{selectedCandidate.summary}</Text>
                  </div>
                </Card>
              )}

              {selectedCandidate.questions && (
                <Card size="small" className="questions-card">
                  <Title level={4}>Questions & Answers</Title>
                  {selectedCandidate.questions.map((question, index) => (
                    <div key={index} style={{ marginBottom: '16px', padding: '12px', background: '#f9f9f9', borderRadius: '8px' }}>
                      <div><strong>Q{index + 1}:</strong> {question}</div>
                      <div><strong>Answer:</strong> {selectedCandidate.answers?.[index] || 'No answer provided'}</div>
                      <div><strong>Score:</strong> <Tag color="blue">{selectedCandidate.individualScores?.[index] || 0}/10</Tag></div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default InterviewerDashboard;
