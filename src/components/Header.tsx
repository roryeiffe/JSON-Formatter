import React from "react"
import { Link } from "react-router-dom"
export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-8 px-4 shadow-lg rounded-b-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <Link className="text-3xl font-bold text-left mx-4 cursor-pointer hover:bg-blue-700 p-2" to = '/'>
          Unit Creation
        </Link>
        <Link className="text-3xl font-bold text-left mx-4 cursor-pointer hover:bg-blue-700 p-2" to = '/activities'>
          Activity Creation
        </Link>  
        <Link className="text-3xl font-bold text-left mx-4 cursor-pointer hover:bg-blue-700 p-2" to = '/excel'>
          Excel Uploader  
        </Link>


      </div>
    </header>
  )

}