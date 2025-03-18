import './App.css'
import { Header } from './components/Header';
import React from 'react';
import { AppProps } from './types';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import GenerateJSON from './components/GenerateJSON';
import GenerateActivities from './components/GenerateActivities';

const App = ({ onClick, text }: AppProps) => {


  return (
    <>

      <Header></Header>
        <Routes>

          <Route path="/" Component={GenerateJSON} />
          <Route path="/activities" Component={GenerateActivities} />
        </Routes>

    </>
  )
}

export default App
