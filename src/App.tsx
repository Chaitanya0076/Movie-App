import { useState, useEffect } from "react"
import axios from 'axios'
import Search from "./components/Search"
import Spinner from "./components/Spinner";
import { Movie } from "./shared/movie-type";
import { Models } from "appwrite";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./shared/appwrite";


// const API_KEY = import.meta.env.VITE_API_KEY;

const API_ACCESS_TOKEN = import.meta.env.VITE_ACCESS_TOKEN;

const API_BASE_URL = `https://api.themoviedb.org/3/`; //keyword/${API_KEY}/movies/`;
const API_URL_WITHOUT_SEARCH_QUERY = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
const API_URL_WITH_SEARCH_QUERY = `${API_BASE_URL}/search/movie`;

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [trendingMovies, setTrendingMovies] = useState<Models.Document[] | undefined>([]);

  useDebounce(() => {
    setDebouncedSearchTerm(searchTerm);
  }, 1000, [searchTerm]);

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    const url = query ? `${API_URL_WITH_SEARCH_QUERY}?query=${encodeURIComponent(query)}` : API_URL_WITHOUT_SEARCH_QUERY;
    try {
      const moviesData = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${API_ACCESS_TOKEN}`,
          'Content-Type': 'application/json;charset=utf-8'
        }
      });
      
      setMovieList(moviesData.data.results);
      if(query && moviesData.data.results.length > 0){
        await updateSearchCount(query, moviesData.data.results[0]);
      }
    } catch (err) {
      console.log(`Error while fetching the movies:${err}`)
      setErrorMsg('Error while fetching the movies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  const fetchTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error('Error while fetching trending movies:', error);
    }
  }
  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm])

  useEffect(() => {
    fetchTrendingMovies();
  }, [])

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle
          </h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        { trendingMovies && trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie['$id']}>
                  <p>{index + 1}</p>  
                  <img src={movie.poster_url} alt={`Trending Movie ${index + 1}`} /> 
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>All Movies</h2>

          {isLoading ? <Spinner /> : errorMsg ? (<p className="text-red-500">{errorMsg}</p>) : (
            <ul>
              {movieList.map((movie:Movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default App