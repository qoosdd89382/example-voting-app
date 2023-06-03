import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io(
    'http://localhost:2000',
    { transports: ['polling'] }
);

const StatsCtrl = () => {

  const [aPercent, setAPercent] = useState(50);
  const [bPercent, setBPercent] = useState(50);
  const [total, setTotal] = useState(0);

  const updateScores = (data) => {

    const { a, b } = JSON.parse(data);

    const percentages = getPercentages(a, b);

    setAPercent(percentages.a);
    setBPercent(percentages.b);
    setTotal(a + b);
  };

  useEffect(() => {
    socket.on('scores', updateScores);

    return () => {
      socket.off('scores', updateScores);
    };
  }, []);

  const getPercentages = (a, b) => {
    const result = {};
    console.log('a',a)
    console.log('b',b)

    if (a + b > 0) {
      result.a = Math.round((a / (a + b)) * 100);
      result.b = 100 - result.a;
    } else {
      result.a = result.b = 50;
    }

    console.log('result', result)
    return result;
  };

  return (
    <div id="background-stats">
<b>{Math.random()}</b>
      <div id="background-stats-1" style={{ width: `${aPercent}%` }}></div>
      <div id="background-stats-2" style={{ width: `${bPercent}%` }}></div>
      <div id="content-container">
        <div id="content-container-center">
          <div id="choice">
            <div className="choice cats">
              <div className="label">Cats</div>
              <div className="stat">{`${aPercent.toFixed(1)}%`}</div>
            </div>
            <div className="divider"></div>
            <div className="choice dogs">
              <div className="label">Dogs</div>
              <div className="stat">{`${bPercent.toFixed(1)}%`}</div>
            </div>
          </div>
        </div>
      </div>
      <div id="result">
        {total === 0 && <span>No votes yet</span>}
        {total === 1 && <span>{total} vote</span>}
        {total >= 2 && <span>{total} votes</span>}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <div className="catsvsdogs">
      <StatsCtrl />
    </div>
  );
};

export default App;
