import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import memberReducer from './features/memberSlice'
import storage from 'redux-persist/lib/storage';

const rootReducer = combineReducers({
    member: memberReducer
    // user: userReducer,
    // rooms: roomReducer,
    // sprints: sprintReducer
    // ... any other reducers ...
  });
  
  const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['member'] // Only user reducer will be persisted
  };
  
  const persistedReducer = persistReducer(persistConfig, rootReducer);
  
  export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'] // Ignore these actions for serializable check
        }
      }),
  });
  
  export const persistor = persistStore(store);
  
  export default store;