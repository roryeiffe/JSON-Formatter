import React from 'react';
import * as XLSX from 'xlsx';
import { useState } from 'react';

const sanitizeActivityName = (name: string) => {
  // split based on spaces, capitalize each word, and join with no spaces
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

const ActivityMappingUtil = () => {
  const [unitPrefix, setUnitPrefix] = React.useState('');
  const [unitShortHand, setUnitShortHand] = React.useState('');

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUnitPrefix(value);
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {



    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    console.log(reader);

    reader.onload = async (e) => {
      const binaryStr = e.target?.result;

      if (!binaryStr) return;

      // get sheets:
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const taxonomySheet = workbook.Sheets['Taxonomy'];

      mapActivities(taxonomySheet);
    }

    reader.readAsBinaryString(file);
  }


  const mapActivities = (taxonomySheet: any) => {
    const data = XLSX.utils.sheet_to_json<Record<string, any>>(taxonomySheet, { defval: '' });

    const newData: Record<string, any>[] = [...mapContentAndVideos(data), ...mapLectures(), ...mapReviewActivities()];


    const newWorksheet = XLSX.utils.json_to_sheet(newData);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'ModifiedData');

    // Write the new workbook and trigger download
    const newWorkbookBinary = XLSX.write(newWorkbook, {
      bookType: 'xlsx',
      type: 'binary'
    });

    const blob = new Blob([s2ab(newWorkbookBinary)], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${unitPrefix}-ActivityMapping.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };





  let modules = new Set<string>();
  const mapContentAndVideos = (data: Record<string, any>[]) => {
    const newData: Record<string, any>[] = [];

    data.forEach((row, index) => {
      modules.add(row.Module);
      // Add row for learning content activity:
      const contentRow = {
        "Module": row.Module,
        "Topic": row.Topic,
        "Activity Order": '',
        "Activity Name": `${unitPrefix}-CT-${sanitizeActivityName(row.Topic)}`,
        "Display Name": row.Topic,
        "Activity Grouping": "Learning Content",
        "Activity Type": "Lesson - Learning Content",
        "Duration": 10,
        "Activity Link": "",
        "Activity Scope": "Topic",
        "Content URL": "",
      }
      // Add row for video activity:
      const videoRow = {
        "Module": row.Module,
        "Topic": row.Topic,
        "Activity Order": '',
        "Activity Name": `${unitPrefix}-VID-${sanitizeActivityName(row.Topic)}`,
        "Display Name": row.Topic + " Video",
        "Activity Grouping": "Learning Content",
        "Activity Type": "Lesson - Video",
        "Duration": 10,
        "Activity Link": "",
        "Activity Scope": "Topic",
        "Content URL": "",
      }
      newData.push(contentRow);
      newData.push(videoRow);
    })

    return newData;
  }

  const mapLectures = () => {
    const newData: Record<string, any>[] = [];
    modules.forEach((module) => {
      const row: Record<string, any> = {
        "Activity Name": `${unitPrefix}-LEC-${module.replace(" ", "")}`,
        "Display Name": module + " Lecture",
        "Activity Grouping": "Learning Content",
        "Activity Type": "Lesson - Live Lecture",
        "Activity Scope": "Module",
        "Topic": "N/A",
        "Duration": 60,
        "Module": module,
      };
      newData.push(row);
    });
    return newData;
  }

  const mapReviewActivities = () => {
    const newData: Record<string, any>[] = [];
    // Review Lecture
    newData.push({
      "Activity Name": `${unitPrefix}-RVLEC-${unitShortHand}`,
      "Display Name": `${unitShortHand} Review Lecture`,
      "Activity Grouping": "Review",
      "Activity Type": "Lesson - Live Lecture",
      "Activity Scope": "Unit",
      "Topic": "N/A",
      "Module": "N/A",
      "Duration": 60
    })


    // Review Reference
    newData.push({
      "Activity Name": `${unitPrefix}-RVREF-${unitShortHand}`,
      "Display Name": `${unitShortHand} Review Reference`,
      "Activity Grouping": "Review",
      "Activity Type": "Reference",
      "Activity Scope": "Unit",
      "Duration": 30,
      "Topic": "N/A",
      "Module": "N/A"
    });

    // Review Video
    newData.push({
      "Activity Name": `${unitPrefix}-RVVID-${unitShortHand}`,
      "Display Name": `${unitShortHand} Review Video`,
      "Activity Grouping": "Review",
      "Activity Type": "Lesson - Video",
      "Activity Scope": "Unit",
      "Duration": 30,
      "Topic": "N/A",
      "Module": "N/A"
    });


    // Office Hours
    newData.push({
      "Activity Name": `${unitPrefix}-OO-${unitShortHand}`,
      "Display Name": `${unitShortHand} Office Hours`,
      "Activity Grouping": "Review",
      "Activity Type": "Office Hours",
      "Activity Scope": "Unit",
      "Duration": 30,
      "Topic": "N/A",
      "Module": "N/A"
    });

    // Self Study
    newData.push({
      "Activity Name": `${unitPrefix}-SS-${unitShortHand}`,
      "Display Name": `${unitShortHand} Self Study`,
      "Activity Grouping": "Review",
      "Activity Type": "Self Study",
      "Activity Scope": "Unit",
      "Duration": 30,
      "Topic": "N/A",
      "Module": "N/A"
    });

    // Mini Project
    newData.push({
      "Activity Name": `${unitPrefix}-MP-${unitShortHand}`,
      "Display Name": `${unitShortHand} Mini Project`,
      "Activity Grouping": "Review",
      "Activity Type": "Lab - Mini Project",
      "Activity Scope": "Unit",
      "Duration": 120,
      "Topic": "N/A",
      "Module": "N/A"
    });

    return newData;

  }


  return (
    <div className="p-4 border rounded-md shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Unit Prefix (ex: "JS" for JavaScript, "TS" for TypeScript)</h2>
      <input className="border p-2 rounded-md w-full" value={unitPrefix} onChange={(e) => setUnitPrefix(e.target.value)}></input>
      <h2 className="text-xl font-bold mb-4">Unit Short-Hand (ex: Instead of "Master TypeScript Concepts", just "TypeScript")</h2>
      <input className="border p-2 rounded-md w-full" value={unitShortHand} onChange={(e) => setUnitShortHand(e.target.value)}></input>
      <h2 className="text-xl font-bold mb-4">Upload Excel File for Activity Mapping</h2>
      <input className="mt-2 m-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold rounded-lg shadow-lg transform text-center transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl mx-auto focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer mb-8"
        type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
    </div>

  );
}


export default ActivityMappingUtil;

function s2ab(s: any) {
  var buf = new ArrayBuffer(s.length);
  var view = new Uint8Array(buf);
  for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
  return buf;
}