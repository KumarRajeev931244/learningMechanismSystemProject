import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import morgan from 'morgan';
import userRoutes from './routes/user.routes.js';
import courseRoutes from './routes/course.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import errorMiddleware from './middlewares/error.Middleware.js';


const app = express();
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true
}))

app.use(cookieParser());
app.use(morgan('dev'))
// here we are using the routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/courses', courseRoutes)
app.use('/api/v1/payments', paymentRoutes)

app.use('/ping', (req, res) => {
    res.send('/pong');
})

// this is the default route for the server
// app.use('*', (req, res) => {
//     res.status(404).json({ message: 'OOPS!! 404 page not found' });
// })

app.use(errorMiddleware)

export default app