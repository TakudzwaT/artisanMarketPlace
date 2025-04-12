

function Login(){
    return(
        <>
        <h1>Login</h1>
        <form>
            <section className="container">
                <input type = "email" required className="emailinput" placeholder="Email Address"></input>

                <input type = "password" required className="loginpassword" placeholder="password"></input>
            
                <button className="loginbutton"> Login</button>
                <section className="rem-con">
                <section className="rem-cont">
                <input type = "checkbox" id = "remember" className="rem-check"></input>
                <label for = "remember" className="rem-label">Remember me</label>
                </section>
                
                <p className="forgotpassword"><a href="#">Forgot password?</a></p>

                </section>
                
           
                          
            <button className="Signupbutton">Sign Up</button>
           </section>
       
        </form>
          
        </>
      
    );
}

export default Login