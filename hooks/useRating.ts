import axios from "axios";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import { toast } from "sonner";
import { useItemRefresh } from "./useItemRefresh";

const getRatingsReceived = async({userId}:{userId:string}) => {
    const response = await axios.get(`/api/users/${userId}/ratings`);
    return response.data;
}

export const useGetRatingsReceived = ({userId}:{userId:string}) => {
    return useQuery({
        queryKey: ['ratings-received', userId],
        queryFn:() => getRatingsReceived({userId}),
        enabled: !!userId,
    })
}

const rateUser = async({rating, comment, userId}:{rating:number, comment:string, userId:string}) => {
    const response = await axios.post(`/api/users/${userId}/rate`, {rating, comment})
    return response.data;
}

export const useRateUser = () => {
    const { refreshItem } = useItemRefresh();
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['rate-user'],
        mutationFn: rateUser,
        onError: (error) => {
            console.error(error)
        },
        onSuccess: (data, variables) => {
            toast.success('Recenzija uspješno poslata')
            // Invalidate multiple queries to update all rating displays
            queryClient.invalidateQueries({queryKey: ['ratings-received', variables.userId]})
            queryClient.invalidateQueries({queryKey: ['ratings-received']}) // Fallback for any other queries
            queryClient.invalidateQueries({queryKey: ['public-items']})
            queryClient.invalidateQueries({queryKey: ['my-items']})
            queryClient.invalidateQueries({queryKey: ['userActivity']})
            queryClient.invalidateQueries({queryKey: ['profile']})
        }
    })
}

