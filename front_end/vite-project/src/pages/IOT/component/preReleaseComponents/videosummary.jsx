import './videosummary.css';

const VideoSummary = () => {
  return (
    <div className="videosum-root">
      <h1 className="videosum-title">AI 搜索</h1>
      <p className="videosum-desc">实时资讯，丰富信源，整合搜索</p>
      <div className="videosum-input-area">
        <input className="videosum-input" placeholder="搜索、提问或发消息" />
        <button className="videosum-search-btn">全网搜索</button>
      </div>
      <div className="videosum-section">
        <h2>定制属于你的新闻</h2>
        <div className="videosum-tags">
          <span>AI</span><span>科技</span><span>财经</span><span>科学</span><span>时事</span><span>汽车</span><span>体育</span><span>娱乐</span>
        </div>
      </div>
      <div className="videosum-section">
        <h2>热点新闻</h2>
        <div className="videosum-news-list">
          <div className="videosum-news-item">新闻1</div>
          <div className="videosum-news-item">新闻2</div>
          <div className="videosum-news-item">新闻3</div>
        </div>
      </div>
    </div>
  );
};

export default VideoSummary;