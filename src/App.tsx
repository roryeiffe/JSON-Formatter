import './App.css'
import { Header } from './components/Header';
import React from 'react';
import { AppProps } from './types';
import { Route, Routes } from 'react-router-dom';
import GenerateJSON from './pages/GenerateJSONPage';
import GenerateActivitiesPage from './pages/GenerateActivitiesPage';
import ExcelUploader from './components/ExcelUploader';
import ActivityMappingUtil from './pages/ActivityMappingUtil';

const App = ({ onClick, text }: AppProps) => {


  return (
    <>

      <Header></Header>
        <Routes>
          <Route path="/" Component={ExcelUploader} />
          <Route path="/activities" Component={GenerateActivitiesPage} />
          <Route path="/excel" Component={ExcelUploader} />
          <Route path="/mapping" Component = {ActivityMappingUtil}/>
        </Routes>
    </>
  )
}

export default App
