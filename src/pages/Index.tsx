
import { useState } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { RecognitionResult } from '@/components/home/RecognitionResult';
import { useAttendanceSystem } from '@/hooks/useAttendanceSystem';
import { motion } from 'framer-motion';
import { Camera, UserCircle2, HelpCircle, RotateCw } from 'lucide-react';
import AttendanceCamera from '@/components/AttendanceCamera';

const Index = () => {
  const {
    isCameraActive,
    detectedBuilder,
    showIntro,
    passiveMode,
    setPassiveMode,
    handleBuilderDetected,
    startAttendance,
    reset
  } = useAttendanceSystem();

  // Add state for force user selection
  const [forceUser, setForceUser] = useState<string | null>(null);

  // Function to toggle forced user for testing
  const toggleForceUser = (username: string) => {
    if (forceUser === username) {
      setForceUser(null);
      // Remove force_user parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('force_user');
      window.history.replaceState({}, '', url.toString());
    } else {
      setForceUser(username);
      // Add force_user parameter to URL
      const url = new URL(window.location.href);
      url.searchParams.set('force_user', username);
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/50">
      <Header />
      
      <main className="pt-12 pb-16 px-4 container max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            FaceID Attendance System
          </h1>
          <p className="mt-3 text-muted-foreground">
            Register your face or mark your attendance with face recognition
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-center mt-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col space-y-6"
          >
            {detectedBuilder ? (
              <RecognitionResult
                detectedBuilder={detectedBuilder}
                passiveMode={passiveMode}
                reset={reset}
              />
            ) : (
              <div className="glass-card p-6 flex flex-col space-y-6">
                <h2 className="text-xl font-semibold text-center">Attendance Options</h2>
                
                <div className="flex flex-col space-y-3">
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
                  
                  {/* Test mode controls for easier debugging */}
                  <div className="flex items-center justify-between glass-card p-4 bg-amber-50/50">
                    <div className="flex items-center">
                      <span className="mr-2">Test Mode</span>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Debug</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={forceUser === 'greg' ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleForceUser('greg')}
                      >
                        Greg
                      </Button>
                      <Button
                        variant={forceUser === 'stefano' ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleForceUser('stefano')}
                      >
                        Stefano
                      </Button>
                      {forceUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleForceUser(forceUser)}
                        >
                          <RotateCw size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
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
                
                {forceUser && (
                  <div className="text-xs text-center p-2 bg-amber-100 rounded-lg text-amber-800">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <HelpCircle size={14} />
                      <span className="font-medium">Test Mode Active</span>
                    </div>
                    <p>System will recognize you as {forceUser === 'greg' ? 'Greg Hogue' : 'Stefano Barros'}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card p-4 md:p-6"
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
                <p className="text-muted-foreground max-w-xs mb-4">
                  {passiveMode 
                    ? "Click Start Face Recognition to begin passive scanning" 
                    : "Click Start Face Recognition to activate the camera and check in"}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;
