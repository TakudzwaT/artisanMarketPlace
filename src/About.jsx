import Navi from "./components/sellerNav"

function AboutUs() {
    return (
        <>
            <Navi />
            <div className="about-us-container">
                <h1 className="AboutUsH">Welcome to Local Artisan!</h1>
                <p className="intro-text">
                    We're a team of passionate creators dedicated to supporting local craftsmanship and bringing you unique, hand-made treasures.
                </p>
                <h2 className="team-header">Meet the Dream Team ✨</h2>
                <ul className="team-list">
                    <li><strong>Matimu Khosa</strong>The Code Whisperer 🧙‍♂️ (Rumor has it he speaks fluent JavaScript in his sleep!)</li>
                    <li><strong>Muhluri Myambo</strong> UX Maestro 🎨 (Has a sixth sense for colors that just *work*.)</li>
                    <li><strong>Takudzwa Mhizha</strong>Backend Ninja 🥷 (Fast, efficient, and rarely seen—just like good API calls.)</li>
                    <li><strong>Steven Mabasa</strong> Debugging Legend 🛠️ (If there's a bug, Steven will find it—and probably name it too.)</li>
                    <li><strong>Lazola Simane</strong> Creative Spark ⚡ (Every great idea starts with Lazola saying “What if we just...”)</li>
                </ul>
                <p className="closing-text">
                    We're on a mission to make buying local feel global. Thanks for being part of our journey!
                </p>
            </div>
        </>
    )
};

export default AboutUs;
