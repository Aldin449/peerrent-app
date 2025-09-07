import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

interface ProfileData {
  name?: string;
  bio?: string;
  phoneNumber?: string;
  location?: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  phoneNumber: string | null;
  location: string | null;
  profilePicture: string | null;
  createdAt: Date | null;
}

// Hook to get current user profile
export const useProfile = () => {
  return useQuery<User>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await axios.get('/api/profile');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook to update profile information
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData: ProfileData) => {
      const response = await axios.put('/api/profile/update', profileData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profil je uspješno ažuriran');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Greška pri ažuriranju profila');
    },
  });
};

// Hook to upload profile picture
export const useUploadProfilePicture = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await axios.post('/api/profile/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profilna slika je uspješno uploadovana');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Greška pri uploadovanju slike');
    },
  });
};
