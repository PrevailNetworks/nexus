import React from 'react';
import TimeclockWidget from '../components/timeclock/TimeclockWidget';

const TimeclockPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Time Clock</h1>
        <p className="text-muted-foreground">
          Clock in and out, and track your work hours.
        </p>
      </div>
      
      <TimeclockWidget />
    </div>
  );
};

export default TimeclockPage;