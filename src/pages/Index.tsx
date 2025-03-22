
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, ChevronDown, Users, CheckCircle, UserCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import AttendanceCamera from '@/components/AttendanceCamera';
import BuilderCard, { Builder } from '@/components/BuilderCard';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedBuilder, setDetectedBuilder] = useState<Builder | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [passiveMode, setPassiveMode] = useState(false);

  const handleBuilderDetected = (builder: Builder) => {
    setDetectedBuilder(builder);
    
    // Don't automatically close camera in passive mode
    if (!passiveMode) {
      setTimeout(() => {
        setIsCameraActive(false);
      }, 1000);
    }
  };

  const startAttendance = () => {
    setShowIntro(false);
    setDetectedBuilder(null);
    setIsCameraActive(true);
  };

  const reset = () => {
    setDetectedBuilder(null);
    setIsCameraActive(false);
    setShowIntro(true);
    setPassiveMode(false);
  };

  // Simulated stats for the UI
  const stats = [
    { label: 'Enrolled Builders', value: '248', icon: <Users size={20} /> },
    { label: 'Attendance Today', value: '86%', icon: <CheckCircle size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/50">
      <Header />
      
      <main className="pt-24 pb-16 px-4 container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="section-subtitle inline-block mb-2">Modern Attendance Solution</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            FaceID Attendance System
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            The simplest way to track builder attendance using advanced facial recognition technology.
            Fast, accurate, and secure.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center mt-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col space-y-6"
          >
            {showIntro ? (
              <>
                <div className="flex space-x-4 justify-center md:justify-start">
                  {stats.map((stat, i) => (
                    <div 
                      key={stat.label} 
                      className="glass-card p-4 flex-1 flex flex-col items-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                        {stat.icon}
                      </div>
                      <span className="text-2xl font-bold">{stat.value}</span>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                  ))}
                </div>
                
                <div className="glass-card p-6">
                  <h2 className="text-xl font-semibold mb-3">How It Works</h2>
                  <ol className="space-y-4 text-sm">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
                        1
                      </div>
                      <div>
                        <span className="font-medium">Register your face</span>
                        <p className="text-muted-foreground mt-1">Builders need to register their face before using the system.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
                        2
                      </div>
                      <div>
                        <span className="font-medium">Activate the camera</span>
                        <p className="text-muted-foreground mt-1">
                          {passiveMode 
                            ? "Passive mode automatically scans for faces" 
                            : "Click the button below to start the facial recognition process"}
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
                        3
                      </div>
                      <div>
                        <span className="font-medium">Verification complete</span>
                        <p className="text-muted-foreground mt-1">Your attendance is recorded instantly in the system.</p>
                      </div>
                    </li>
                  </ol>
                </div>
                
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between glass-card p-4">
                    <div className="flex items-center">
                      <span className="mr-2">Passive Mode</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">New</span>
                    </div>
                    <Switch 
                      checked={passiveMode} 
                      onCheckedChange={setPassiveMode} 
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    {passiveMode 
                      ? "Passive mode will automatically recognize builders without clicks" 
                      : "Enable passive mode for automatic face recognition"}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <Button
                      onClick={startAttendance}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Camera size={20} />
                      Start Face Recognition
                    </Button>
                    
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Link to="/register">
                        <UserCircle2 size={20} />
                        Register Face
                      </Link>
                    </Button>
                  </div>
                </div>
              </>
            ) : detectedBuilder ? (
              <div className="flex flex-col space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-green-800">Attendance Recorded!</h3>
                  <p className="text-sm text-green-600 mt-1">
                    Successfully verified and recorded.
                  </p>
                </div>
                
                <BuilderCard builder={detectedBuilder} />
                
                {passiveMode ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Passive mode is active. The system will continue to scan for additional builders.
                    </p>
                    <Button 
                      onClick={reset}
                      variant="outline"
                    >
                      Reset Camera
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={reset}
                    className="py-4 flex items-center justify-center gap-2 mx-auto md:mx-0"
                  >
                    Record Another Attendance
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col space-y-6 items-center md:items-start">
                <h2 className="text-xl font-semibold">Attendance Recognition</h2>
                <p className="text-muted-foreground text-center md:text-left">
                  {passiveMode
                    ? "Passive mode is active. Just look at the camera to be recognized."
                    : "Position your face clearly in the frame and click the capture button."}
                </p>
                
                <div className="flex items-center space-x-4">
                  <Switch 
                    checked={passiveMode} 
                    onCheckedChange={setPassiveMode} 
                    id="passive-mode"
                  />
                  <label htmlFor="passive-mode" className="text-sm">
                    Passive Mode {passiveMode ? "Enabled" : "Disabled"}
                  </label>
                </div>
                
                <Button 
                  onClick={() => setIsCameraActive(false)}
                  variant="secondary"
                  className="py-3 flex items-center justify-center gap-2"
                >
                  Cancel
                </Button>
              </div>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card p-4 md:p-8"
          >
            {isCameraActive ? (
              <AttendanceCamera 
                onBuilderDetected={handleBuilderDetected}
                isCameraActive={isCameraActive}
                passive={passiveMode}
                passiveInterval={3000}
              />
            ) : detectedBuilder ? (
              <div className="flex flex-col items-center justify-center h-full py-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4"
                >
                  {detectedBuilder.image ? (
                    <img 
                      src={detectedBuilder.image} 
                      alt={detectedBuilder.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
                      {detectedBuilder.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </motion.div>
                <h3 className="text-2xl font-bold">{detectedBuilder.name}</h3>
                <p className="text-muted-foreground">ID: {detectedBuilder.builderId}</p>
                <div className="mt-4 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Attendance recorded at {detectedBuilder.timeRecorded}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Camera size={40} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Face Recognition</h3>
                <p className="text-muted-foreground max-w-xs mb-6">
                  {passiveMode 
                    ? "Activate camera to begin passive scanning for faces" 
                    : "Click the button to activate the camera and start the attendance process"}
                </p>
                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-muted-foreground opacity-60"
                >
                  <ChevronDown size={24} />
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;
