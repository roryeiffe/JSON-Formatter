import { Navbar } from './components/Navbar';
import React from 'react';
import { AppProps } from './types';
import { Route, Routes } from 'react-router-dom';
import ExcelUploader from './components/ExcelUploader';
import ActivityMappingUtil from './components/ActivityMappingUtil';

const App = ({ onClick, text }: AppProps) => {


  return (
    <>
      <Navbar />
        <Routes>
          <Route path="/" Component={ExcelUploader} />
          <Route path="/excel" Component={ExcelUploader} />
          <Route path="/mapping" Component = {ActivityMappingUtil}/>
        </Routes>
    </>
  )
}

export default App
