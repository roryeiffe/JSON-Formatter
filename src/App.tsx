import './App.css'
import { Header } from './components/Header';
import React from 'react';
import { AppProps } from './types';
import { Route, Routes } from 'react-router-dom';
import GenerateJSON from './pages/GenerateJSONPage';
import GenerateActivitiesPage from './pages/GenerateActivitiesPage';
import ExcelUploader from './components/ExcelUploader';

const App = ({ onClick, text }: AppProps) => {


  return (
    <>

      <Header></Header>
        <Routes>
          <Route path="/" Component={GenerateJSON} />
          <Route path="/activities" Component={GenerateActivitiesPage} />
          <Route path="/excel" Component={ExcelUploader} />
        </Routes>
    </>
  )
}

export default App
