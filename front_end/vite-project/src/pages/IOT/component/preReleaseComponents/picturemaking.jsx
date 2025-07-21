import './picturemaking.css';

const PictureMaking = () => {
  return (
    <div className="picgen-root">
      <h1 className="picgen-title">图像生成</h1>
      <p className="picgen-desc">创意高效迭代，让灵感自然生长</p>
      <div className="picgen-input-area">
        <input className="picgen-input" placeholder="说说你的灵感..." />
        <div className="picgen-btn-group">
          <button>参考图</button>
          <button>比例</button>
          <button>风格</button>
        </div>
      </div>
      <div className="picgen-section">
        <h2>精选</h2>
        <div className="picgen-gallery">
          <div className="picgen-img-item">图片1</div>
          <div className="picgen-img-item">图片2</div>
          <div className="picgen-img-item">图片3</div>
          <div className="picgen-img-item">图片4</div>
        </div>
      </div>
    </div>
  );
};

export default PictureMaking;