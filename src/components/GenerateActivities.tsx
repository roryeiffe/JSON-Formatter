import '../App.css'
import { useState } from 'react';
import React from 'react';
import { AppProps } from '../types';
import UnitDisplay from './UnitDisplay';

const GenerateActivities = () => {


  return (
    <section className="min-h-screen bg-gray-100 text-gray-900">
      <UnitDisplay />
    </section>
  )
}

export default GenerateActivities;
