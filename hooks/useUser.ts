import axios from "axios";
import { useMutation } from "@tanstack/react-query";

const deleteUser = async () => {
    const response = await axios.delete("/api/profile/delete");
    return response.data;
}

export const useDeleteUser = ({onSuccess}:{onSuccess:()=>void}) => {
    return useMutation({
        mutationKey:['delete-user'],
        mutationFn:deleteUser,
        onSuccess: () => {
            if (onSuccess) onSuccess();
        }
    })
}