import React, { useState, ChangeEvent} from "react";

import { ArtifactAttachment } from "../../types";

import { ArtifactAttachmentProps } from "../../types";


function ArtifactAttachmentForm({activity, setActivity}:ArtifactAttachmentProps) {

  const [artifact, setArtifact] = useState<ArtifactAttachment>({
    "name": "Artifact",
    "description": "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    "fileUrl": "http://example.com",
    "fileName": "Study Guide",
    "fileSize": "250MB"
  });


  const onChangeHandler = (event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
    setArtifact({
      ...artifact,
      [event.target.name]: event.target.value
    })
  }

  const onAddHandler = (event: any) => {
    event.preventDefault();
    if(!activity.artifactAttachments) return;
    const newArtifact = { ...artifact };
    for (const artifactItem of activity.artifactAttachments) {
      if (artifactItem.name === newArtifact.name) {
        alert("Artifact with this name already exists.");
        return;
      }
    }
    setActivity({...activity, artifactAttachments: [...activity.artifactAttachments, newArtifact]});
  }

  const deleteHandler = (artifactName: string) => {
    setActivity({
      ...activity,
      artifactAttachments: activity.artifactAttachments?.filter((artifactItem) => artifactItem.name !== artifactName)
    })
  }



  return (
    <div>
      <div className="max-w-lg my-7 mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h3 className='text-2xl text-center'>Add Artifact Attachment</h3>

        <label htmlFor="artifact-name" className="block text-xl mt-2">Artifact Name*</label>
        <input required id="artifact-name" type="text" className="block px-4 py-2 mt-2 border
        border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-1/1" name='name' value={artifact?.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e)} />

        <label htmlFor="artifact-description" className="block text-xl mt-2">Artifact Description*</label>
        <textarea required id="artifact-description" className="block px-4 py-2 mt-2 border
        border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-full" name='description' value={artifact?.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeHandler(e)} />

        <label htmlFor="artifact-file-url" className="block text-xl mt-2">Artifact File URL*</label>
        <input required id="artifact-file-url" type="text" className="block px-4 py-2 mt-2 border
        border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-full" name='fileUrl' value={artifact?.fileUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e)} />

        <label htmlFor="artifact-file-name" className="block text-xl mt-2">Artifact File Name*</label>
        <input required id="artifact-file-name" type="text" className="block px-4 py-2 mt-2 border
        border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-full" name='fileName' value={artifact?.fileName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e)} />

        <label htmlFor="artifact-file-size" className="block text-xl mt-2">Artifact File Size*</label>
        <input required id="artifact-file-size" type="text" className="block px-4 py-2 mt-2 border
        border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-full" name='fileSize' value={artifact?.fileSize} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e)} />

        <button onClick={(e) => onAddHandler(e)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition duration-300">Add Artifact</button>
      </div>

      <div>
        {activity.artifactAttachments.length > 0 && activity.artifactAttachments.map((artifactItem) => {
          return (
            <div key={artifactItem.name} className="max-w-lg my-7 mx-auto p-6 bg-white rounded-lg shadow-md">
              <div className = "flex items-center justify-between">
                <h2 className="text-xl font-semibold">{artifactItem.name}</h2>
                <button onClick={() => deleteHandler(artifactItem.name)} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition duration-300">Delete</button>
              </div>
              <p>{artifactItem.description}</p>
              <p>File URL: {artifactItem.fileUrl}</p>
              <p>File Name: {artifactItem.fileName}</p>
              <p>File Size: {artifactItem.fileSize}</p>
            </div>
          )
        })}
      </div>

    </div>
  )


}

export default ArtifactAttachmentForm;