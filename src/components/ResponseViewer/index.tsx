import React, { useState, useMemo } from "react";
import { Tabs, Empty, Tag, Spin, Button, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import type { TabsProps } from "antd";
import type { ResponseData } from "../../types";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

interface ResponseViewerProps {
  response: ResponseData | null;
  loading: boolean;
}

const getStatusColor = (status: number): string => {
  if (status < 200) return "default";
  if (status < 300) return "success";
  if (status < 400) return "warning";
  return "error";
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

export const ResponseViewer: React.FC<ResponseViewerProps> = ({
  response,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState("body");

  const handleCopy = () => {
    if (response?.data) {
      navigator.clipboard.writeText(response.data);
      message.success("已复制到剪贴板");
    }
  };

  const { isJson, jsonData } = useMemo(() => {
    if (!response?.data) return { isJson: false, jsonData: null };
    try {
      const parsed = JSON.parse(response.data);
      return { isJson: true, jsonData: parsed };
    } catch {
      return { isJson: false, jsonData: null };
    }
  }, [response?.data]);

  if (loading) {
    return (
      <div className="response-viewer loading">
        <Spin size="large" tip="请求发送中..." />
      </div>
    );
  }

  if (!response) {
    return (
      <div className="response-viewer empty">
        <Empty description="发送请求后查看响应" />
      </div>
    );
  }

  const tabs: TabsProps["items"] = [
    {
      key: "body",
      label: "Body",
      children: (
        <div className="response-body">
          <div className="response-body-actions">
            <Button icon={<CopyOutlined />} onClick={handleCopy} size="small">
              复制
            </Button>
          </div>
          <div className="response-content-wrapper">
            {isJson && jsonData ? (
              <JsonView data={jsonData} shouldExpandNode={() => true} />
            ) : (
              <pre className="response-content">{response.data}</pre>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "headers",
      label: "Headers",
      children: (
        <div className="response-headers">
          <table className="headers-table">
            <tbody>
              {Object.entries(response.headers).map(([key, value]) => (
                <tr key={key}>
                  <td className="header-key">{key}</td>
                  <td className="header-value">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <div className="response-viewer">
      <div className="response-status">
        <Tag color={getStatusColor(response.status)} className="status-tag">
          {response.status} {response.statusText}
        </Tag>
        <span className="response-meta">
          {formatTime(response.time)} · {formatSize(response.size)}
        </span>
      </div>
      <div className="container">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabs}
          className="response-tabs"
        />
      </div>
    </div>
  );
};