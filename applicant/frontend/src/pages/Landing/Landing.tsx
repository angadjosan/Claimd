import MinimalNavbar from '../../components/MinimalNavbar';
import MinimalHero from '../../components/MinimalHero';
import MinimalProblem from '../../components/MinimalProblem';

export default function Landing() {
    return (
        <div className="bg-white">
            <MinimalNavbar />
            <main>
                <MinimalHero />
                <MinimalProblem />
            </main>
        </div>
    );
}