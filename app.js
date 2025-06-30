import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import morgan from 'morgan';
import userRoutes from './routes/user.routes';
import errorMiddleware from './middlewares/error.Middleware';



const app = express();
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors({
    origin: [process.env.FRONTEND_URL],
    Credential: true
}))

app.use('/api/v1/users', userRoutes)
app.use(cookieParser());
app.use(morgan('dev'))
app.use('/ping', (req, res) => {
    res.send('/pong');
})

app.all('*', (req, res) => {
    res.status(404).send('OOPS!! 404 page not found')
})

app.use(errorMiddleware)

export default app