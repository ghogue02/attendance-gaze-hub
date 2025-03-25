
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import FaceRegistration from '@/components/face-registration';
import { Builder } from '@/components/builder/types';
import { getAllBuilders, checkFaceRegistrationStatus } from '@/utils/faceRecognition';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { RegisterInstructions } from '@/components/register/RegisterInstructions';
import { BuildersList } from '@/components/register/BuildersList';

interface RegisterProps {
  faceRegistration?: boolean;
}

const Register = ({ faceRegistration }: RegisterProps) => {
  const { builderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<{[key: string]: {completed: boolean, count: number}}>({});

  useEffect(() => {
    loadBuilders();
  }, []);

  useEffect(() => {
    if (faceRegistration && builderId && builders.length > 0) {
      console.log("Face registration mode with builderId:", builderId);
      const foundBuilder = builders.find(s => s.id === builderId);
      if (foundBuilder) {
        setSelectedBuilder(foundBuilder);
        setRegistrationOpen(true);
      } else {
        toast({
          title: "Builder Not Found",
          description: "The builder ID in the URL doesn't match any registered builder.",
          variant: "destructive"
        });
        navigate('/register');
      }
    }
  }, [faceRegistration, builderId, builders, navigate, toast]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBuilders(builders);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredBuilders(
        builders.filter(builder => 
          builder.name.toLowerCase().includes(query) || 
          builder.builderId?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, builders]);

  const loadBuilders = async () => {
    setLoading(true);
    try {
      const allBuilders = await getAllBuilders();
      console.log("Loaded builders:", allBuilders.length);
      setBuilders(allBuilders);
      setFilteredBuilders(allBuilders);
      
      const statuses: {[key: string]: {completed: boolean, count: number}} = {};
      
      for (const builder of allBuilders) {
        const status = await checkFaceRegistrationStatus(builder.id);
        statuses[builder.id] = status;
      }
      
      setRegistrationStatus(statuses);
    } catch (error) {
      console.error('Error loading builders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRegistration = (builder: Builder) => {
    console.log("Starting registration for builder:", builder.id);
    setSelectedBuilder(builder);
    setRegistrationOpen(true);
  };

  const handleRegistrationComplete = () => {
    console.log("Registration completed, refreshing builder data");
    loadBuilders();
    
    if (faceRegistration && builderId) {
      navigate('/register');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

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
          <span className="section-subtitle inline-block mb-2">Face Registration</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Register Your Face
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Register your face from multiple angles to ensure accurate recognition for attendance tracking.
          </p>
        </motion.div>

        <RegisterInstructions 
          buildersCount={builders.length}
          registeredCount={Object.values(registrationStatus).filter(s => s.completed).length}
        />

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Builders</h2>
          
          <BuildersList 
            builders={builders}
            filteredBuilders={filteredBuilders}
            searchQuery={searchQuery}
            loading={loading}
            registrationStatus={registrationStatus}
            onStartRegistration={handleStartRegistration}
            onClearSearch={handleClearSearch}
          />
        </div>
      </main>
      
      {selectedBuilder && (
        <FaceRegistration
          builder={selectedBuilder}
          open={registrationOpen}
          onOpenChange={setRegistrationOpen}
          onComplete={handleRegistrationComplete}
        />
      )}
    </div>
  );
};

export default Register;
