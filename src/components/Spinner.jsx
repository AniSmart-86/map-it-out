import React from 'react'
import './Loader.css'
import SyncLoader from "react-spinners/SyncLoader";



export const Spinner = () => {

  return (
<div className="wrapper">
<div className="loader">

<SyncLoader
    color='#fff'
    loading={true}
    size={17}
    aria-label="Loading Spinner"
    data-testid="loader"
  />

</div>
</div>
// document.getElementById("spinner")
  )
};




