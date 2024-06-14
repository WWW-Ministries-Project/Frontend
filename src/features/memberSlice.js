import { baseUrl } from '../pages/Authentication/utils/helpers';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../axiosInstance';

const initialState = {
    allMembers: {},
    status: '',
    error: null
};

export const fetchMembers = createAsyncThunk('member/fetchmembers', async () => {
    try {
        const response = await axios.get(`${baseUrl}/user/list-users`);
        return response.data.data
    } catch (err) {
        throw error.response.data.data
    }
})

const memberSplice = createSlice({
    name: 'member',
    initialState,
    reducers: {
        setAllMembers: (state, action) => {
            state.allMembers = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(fetchMembers.pending, (state) => {
            state.status = "loading";
        })
        .addCase(fetchMembers.fulfilled, (state, action)=>{
            state.status = "succeeded";
            state.allMembers = action.payload;
        })
        .addCase(fetchMembers.rejected, (state, action) => {
            state.status = "rejected";
            state.allMembers = action.error
        })
    }
})

export const {setAllMembers} = memberSplice;
export default memberSplice.reducer;

// Selectors
export const selectAllMembers = (state) => state.member.allMembers
export const selectStatus = (state) => state.member.status
export const selectError = (state) => state.member.error