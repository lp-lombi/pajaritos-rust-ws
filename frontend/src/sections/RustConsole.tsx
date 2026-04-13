import './RustConsole.css'

function RustConsole() {
  return (
    <>
        <h2>RNCE</h2>
        <div className="console-out"></div>
        <input type="text" className="console-in" placeholder=">" />
    </>
  )
}

export default RustConsole