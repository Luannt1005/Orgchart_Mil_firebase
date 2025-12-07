'use client'
import { useRouter } from "next/navigation"
import { Button } from 'react-bootstrap';

const Facebook = () => {
    const router = useRouter()
    const handlebtn = () => {
        router.push("/")
    }
    return(
        <div>
            Facebook page
            <div>
                <Button variant='danger'> thanhluan </Button>
                <button onClick={handlebtn}>Backhome</button>
            </div>
        </div>
    )
}
export default Facebook