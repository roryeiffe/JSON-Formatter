import React, { useState, ChangeEvent } from "react";
import { URLAttachment } from "../../types";

import { URLAttachmentFormProps } from "../../types";


function URLAttachmentForm({ activity, setActivity }: URLAttachmentFormProps) {

  const [urlAttachment, setUrlAttachment] = useState<URLAttachment>({
    "name": "URL",
    "description": "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    "url": "http://example.com",
    "tutorials": false
  });


  const onChangeHandler = (event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
    setUrlAttachment({
      ...urlAttachment,
      [event.target.name]: event.target.value
    })
  }

  const onCheckboxChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setUrlAttachment({
      ...urlAttachment,
      [event.target.name]: event.target.checked
    })
  }

  const onAddHandler = (event: any) => {
    event.preventDefault();
    console.log(urlAttachment);
    if (!activity.urlAttachments) return;
    const newUrlAttachment = { ...urlAttachment };
    for (const artifactItem of activity.urlAttachments) {
      if (artifactItem.name === newUrlAttachment.url || artifactItem.name === newUrlAttachment.name) {
        alert("URL Attachment with this name and/or URL already exists.");
        return;
      }
    }
    setActivity({ ...activity, urlAttachments: [...activity.urlAttachments, newUrlAttachment] });
  }

  const deleteHandler = (url: string) => {
    setActivity({
      ...activity,
      urlAttachments: activity.urlAttachments?.filter((urlItem) => urlItem.url !== url)
    })
  }



  return (
    <div>
      <div className="max-w-lg my-7 mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h3 className='text-2xl text-center'>Add URL Attachment</h3>


        <label htmlFor="url-name" className="block text-xl mt-2">URL Name*</label>
        <input id="url-name" type="text" className="block px-4 py-2 mt-2 border
        border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-1/1" name='name' value={urlAttachment?.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e)} />

        <label htmlFor="url-description" className="block text-xl mt-2">URL Description*</label>
        <textarea id="url-description" className="block px-4 py-2 mt-2 border
        border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2" rows={4} name='description' value={urlAttachment?.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeHandler(e)} />

        <label htmlFor="url-url" className="block text-xl mt-2">URL*</label>
        <input id="url-url" type="text" className="block px-4 py-2 mt-2 border
        border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2" name='url' value={urlAttachment?.url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e)} />

        <label htmlFor="url-tutorials" className="block text-xl mt-2">Is this a tutorial?*</label>
        <input id="url-tutorials" type="checkbox" className="block mt-2" name='tutorials' checked={urlAttachment?.tutorials} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCheckboxChangeHandler(e)} />


        <button onClick={(e) => onAddHandler(e)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition duration-300">Add URL Attachment</button>
      </div>

      <div>
        {activity.urlAttachments.length > 0 && activity.urlAttachments.map((urlItem) => {
          return (
            <div key={urlItem.url} className="max-w-lg my-7 mx-auto p-6 bg-white rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className='text-2xl text-center'>{urlItem.name}</h3>
                <button onClick={() => deleteHandler(urlItem.url)} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition duration-300">Delete URL Attachment</button>
              </div>
              <p className='text-lg'>Description: {urlItem.description}</p>
              <p className='text-lg'>URL: {urlItem.url}</p>
              <p className='text-lg'>Is this a tutorial? {urlItem.tutorials ? "Yes" : "No"}</p>
            </div>
          )
        })}
      </div>

    </div>
  )


}

export default URLAttachmentForm;