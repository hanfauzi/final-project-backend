import prisma from "../../prisma/prisma.service"

export class ShiftService {
    getAllShift = async () => {
        const shifts = await prisma.shift.findMany({
            where : {deletedAt: null}
        })

        return shifts
    }
}