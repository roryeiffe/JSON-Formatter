import '../App.css'
import { Taxonomy } from './navigation/Taxonomy'
import { Header } from './Header';
import { useState } from 'react';
import React from 'react';
import { AppProps } from '../types';
import UnitDisplay from './UnitDisplay';

const GenerateJSON = () => {

  const jsonData = {

    "id": "ae8a8ce2-74a07042-26a349fd-33887c16",
    "title": "Developing and Debugging Java Applications",
    "description": "Exa-Java-Fundamentals",
    "modules": [
      {
        "id": "5592f655-89efd721-0c252d79-aa1e2af1",
        "title": "Java-Orientation",
        "description": "java-orientation",
        "topics": []
      }
    ],
    "tags": [
      "Java"
    ],
    "skills": [
      "Java",
      "Spring"
    ],
    "exitCriterias": []

  };

  const [displayUnitCreationForm, setUnitCreationForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 py-10">

      {
        displayUnitCreationForm && <Taxonomy closeForm={() => setUnitCreationForm(false)}></Taxonomy>
      }
      {
        !displayUnitCreationForm &&
        <section className='flex'>

          <section className="  mx-auto my-6 px-6 py-4 bg-white rounded-lg shadow-md w-[600px]">
            <h2 className="text-2xl font-semibold text-center mb-4 mt-5">Preview of Unit</h2>

            <pre className="bg-white-800 w-[500px] m-auto text-blue-950 p-6 rounded-lg shadow-xl font-mono text-sm whitespace-pre-wrap ">
              {JSON.stringify(jsonData, null, 2)}
            </pre>

            <button
              onClick={() => setUnitCreationForm(prev => !prev)}
              className="block mt-12 m-12 py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 
            text-white font-semibold rounded-lg shadow-lg transform text-center
            transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl mx-auto 
            focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
            >Generate a Unit</button>
          </section>

        </section>
      }
    </div>
  )
}

export default GenerateJSON;
