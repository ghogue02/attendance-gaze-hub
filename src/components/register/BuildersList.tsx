
import { Builder } from '@/components/builder/types';
import BuilderCard from './builders/BuilderCard';
import EmptyState from './builders/EmptyState';
import LoadingState from './builders/LoadingState';
import useBuilderImages from './builders/hooks/useBuilderImages';

interface BuildersListProps {
  builders: Builder[];
  filteredBuilders: Builder[];
  searchQuery: string;
  loading: boolean;
  registrationStatus: {[key: string]: {completed: boolean, count: number}};
  onStartRegistration: (builder: Builder) => void;
  onClearSearch: () => void;
}

export const BuildersList = ({
  builders,
  filteredBuilders,
  searchQuery,
  loading,
  registrationStatus,
  onStartRegistration,
  onClearSearch
}: BuildersListProps) => {
  const { builderImages, imageLoadErrors, handleImageError } = useBuilderImages(filteredBuilders);

  if (loading) {
    return <LoadingState />;
  }
  
  if (filteredBuilders.length === 0) {
    return <EmptyState searchQuery={searchQuery} onClearSearch={onClearSearch} />;
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {filteredBuilders.map(builder => (
        <BuilderCard
          key={builder.id}
          builder={builder}
          imageUrl={builderImages[builder.id]}
          hasImageLoadError={!!imageLoadErrors[builder.id]}
          registrationStatus={registrationStatus[builder.id] || { completed: false, count: 0 }}
          onImageError={handleImageError}
          onStartRegistration={onStartRegistration}
        />
      ))}
    </div>
  );
};

export default BuildersList;
