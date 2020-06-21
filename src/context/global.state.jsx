import React, {createContext, useReducer} from 'react';
import AppReducer from './app.reducer';

import ActionTypes from './app.types';
import {auth, googleProvider, createUserProfile, firestore} from '../firebase/firebase';
import firebase from '../firebase/firebase';

const INITIAL_STATE = {
    currentUser: null,
    isProcessing: false,
    error: null
};

export const GlobalContext = createContext(INITIAL_STATE);

export const GlobalProvider = ({children}) => {
    const [state, dispatch] = useReducer(AppReducer, INITIAL_STATE);

    async function getSnapshotFromUser(userAuth) {
        try {
            const userRef = await createUserProfile(userAuth);
            const userSnapshot = await userRef.get();
            dispatch({
                type: ActionTypes.SIGN_IN_SUCCESS,
                payload: {id: userSnapshot.id, ...userSnapshot.data()}
            });
        } catch(error) {
            dispatch({
                type: ActionTypes.SIGN_IN_FAILURE,
                payload: error
            });
        }
    };

    async function signInWithGoogle() {
        try {
            const {user} = await auth.signInWithPopup(googleProvider);
            await getSnapshotFromUser(user);
        } catch(error) {
            dispatch({
                type: ActionTypes.SIGN_IN_FAILURE,
                payload: error
            });
            alert(error.message);
        }
    }

    async function signInWithEmail(userData) {
        dispatch({
            type: ActionTypes.EMAIL_SIGN_IN_START
        });

        const {email, password} = userData;

        try {
            const {user} = await auth.signInWithEmailAndPassword(email, password);
            await getSnapshotFromUser(user);
        } catch(error) {
            dispatch({
                type: ActionTypes.SIGN_IN_FAILURE,
                payload: error
            });
            alert(error.message);
        }
    }

    async function signUp(registerData) {
        dispatch({
            type: ActionTypes.SIGN_UP_START
        });

        const {email, password} = registerData;

        try {
            const {user} = await auth.createUserWithEmailAndPassword(email, password);
            dispatch({
                type: ActionTypes.SIGN_UP_SUCCESS
            });
            await getSnapshotFromUser(user);
        } catch(error) {
            dispatch({
                type: ActionTypes.SIGN_UP_FAILURE,
                payload: error
            });
            alert(error.message);
        }
    }

    async function signOut() {
        try {
            await auth.signOut();
            dispatch({
                type: ActionTypes.SIGN_OUT_SUCCESS
            });
        } catch(error) {
            dispatch({
                type: ActionTypes.SIGN_OUT_FAILURE,
                payload: error
            });
            alert(error.message);
        }
    }

    function getUserRef() {
        const userRef = firestore.doc(`users/${state.currentUser.id}`);
        return userRef;
    }

    async function addTransaction(transaction) {
        const userRef = await getUserRef();
        await userRef.update({
            accountTransactions: firebase.firestore.FieldValue.arrayUnion(transaction)
        })
        dispatch({
            type: ActionTypes.ADD_TRANSACTION,
            payload: transaction
        })
    }

    function removeTransaction(transaction) {
        const userRef = getUserRef();
        userRef.update({
            accountTransactions: firebase.firestore.FieldValue.arrayRemove(transaction)
        })
        dispatch({
            type: ActionTypes.REMOVE_TRANSACTION,
            payload: transaction
        })
    }

    return (
        <GlobalContext.Provider value={{
            currentUser: state.currentUser,
            isProcessing: state.isProcessing,
            signInWithGoogle,
            signInWithEmail,
            signUp,
            signOut,
            addTransaction,
            removeTransaction
        }}>
            {children}
        </GlobalContext.Provider>
    );
};