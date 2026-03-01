import { useModelTestStore } from './modelTestStore';

export function ObstacleHUD() {
  const obstacleModels = useModelTestStore((s) => s.obstacleModels);
  const selectedObstacle = useModelTestStore((s) => s.selectedObstacle);
  const obstacleScale = useModelTestStore((s) => s.obstacleScale);
  const obstacleRotationY = useModelTestStore((s) => s.obstacleRotationY);
  const showBoundingBox = useModelTestStore((s) => s.showBoundingBox);
  const loadError = useModelTestStore((s) => s.obstacleLoadError);

  return (
    <>
      {/* Obstacle selector */}
      <div style={{ borderTop: '1px solid #444', paddingTop: 8, marginTop: 8 }}>
        <div style={{ color: '#aaa', fontWeight: 'bold', marginBottom: 4 }}>
          Obstacle Model
        </div>
        {loadError && (
          <div style={{
            background: 'rgba(255,60,60,0.2)',
            border: '1px solid rgba(255,60,60,0.4)',
            color: '#faa',
            padding: '6px 8px',
            borderRadius: 4,
            fontSize: '0.7rem',
            lineHeight: 1.3,
            marginBottom: 4,
          }}>
            {loadError}
          </div>
        )}
        <select
          value={selectedObstacle}
          onChange={(e) => useModelTestStore.getState().setSelectedObstacle(e.target.value)}
          style={{
            width: '100%',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            background: '#2a2a3e',
            color: '#ccc',
            border: '1px solid #444',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: 'pointer',
          }}
        >
          {obstacleModels.map((o) => (
            <option key={o.file} value={o.file}>{o.name}</option>
          ))}
        </select>
      </div>

      {/* Scale control */}
      <div style={{ borderTop: '1px solid #444', paddingTop: 8, marginTop: 8 }}>
        <div style={{ color: '#aaa', fontWeight: 'bold', marginBottom: 4 }}>
          Scale: {obstacleScale.toFixed(2)}x
        </div>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.05"
          value={obstacleScale}
          onChange={(e) => useModelTestStore.getState().setObstacleScale(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#4040a0' }}
        />
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {[0.5, 1.0, 2.0, 3.0].map((s) => (
            <button
              key={s}
              onClick={() => useModelTestStore.getState().setObstacleScale(s)}
              style={{
                flex: 1,
                padding: '3px 0',
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                background: Math.abs(obstacleScale - s) < 0.01 ? '#4040a0' : '#2a2a3e',
                color: '#ccc',
                border: '1px solid #444',
                borderRadius: 3,
                cursor: 'pointer',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Rotation control */}
      <div style={{ borderTop: '1px solid #444', paddingTop: 8, marginTop: 8 }}>
        <div style={{ color: '#aaa', fontWeight: 'bold', marginBottom: 4 }}>
          Y Rotation: {Math.round(obstacleRotationY * 180 / Math.PI)}°
        </div>
        <input
          type="range"
          min="0"
          max={String(Math.PI * 2)}
          step="0.05"
          value={obstacleRotationY}
          onChange={(e) => useModelTestStore.getState().setObstacleRotationY(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#4040a0' }}
        />
      </div>

      {/* Bounding box toggle */}
      <div style={{ borderTop: '1px solid #444', paddingTop: 8, marginTop: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showBoundingBox}
            onChange={(e) => useModelTestStore.getState().setShowBoundingBox(e.target.checked)}
            style={{ accentColor: '#4040a0' }}
          />
          <span style={{ color: '#aaa' }}>Show Bounding Box</span>
        </label>
      </div>
    </>
  );
}
