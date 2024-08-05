import { Hono } from "hono"
import { setupHono } from "../../server"
import { databaseConnection } from "../../database"

let app: Hono
let db: any
let token: string = ""
describe("Chat Service Integration Testing", () => {
    beforeAll(async () => {
        app = new Hono()
        app = await setupHono(app)
        db = await databaseConnection()
        token =
            "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTE2LCJlbWFpbCI6ImthdGx5bi5zbWl0aEBnbWFpbC5jb20iLCJ1c2VybmFtZSI6IlByb3BlcmFlcm9wbCIsImlhdCI6MTcxODg0MzQ2MSwiZXhwIjoxNzE4OTI5ODYxLCJpc3MiOiJKb2JiZXIgQXV0aCJ9.qlZIT9RriUawM1MEls3s1MBJjpkhuDlI9z_Pu3saY1XvWYPGa3WcTOwPnnG7rdHy9qnMaqjLiCEcf5Rspp8esw"
    })

    afterAll(() => {
        db.connection.close()
    })

    describe("GET /message/conversation with param [/:senderUsername/:receiverUsername]", () => {
        it("Harus mengembalikan status_code 200 dan array yang berisi kumpulan id percakapan antara pengirim dan penerima pesan", async () => {
            const senderUsername = "Irritatingbo"
            const receiverUsername = "Tumultuousma"
            const res = await app.request(
                `/message/conversation/${senderUsername}/${receiverUsername}`,
                {
                    method: "GET",
                    headers: new Headers({ Authorization: `Bearer ${token}` })
                }
            )

            expect(res.status).toBe(200)
            const resBody = await res.json()
            expect(resBody).not.toBeNull()
        })
    })

    describe("GET /message with param [/:senderUsername/:receiverUsername]", () => {
        it("Harus mengembalikan status_code 200 dan array yang berisi kumpulan pesan (teks atau file) antara pengirim dan penerima pesan", async () => {
            const senderUsername = "notfoundsender"
            const receiverUsername = "notfoundreceiver"
            const res = await app.request(
                `/message/${senderUsername}/${receiverUsername}`,
                {
                    method: "GET",
                    headers: new Headers({ Authorization: `Bearer ${token}` })
                }
            )

            expect(res.status).toBe(200)
            const resBody = await res.json()
            expect(resBody).not.toBeNull()
        })
    })

    describe("GET /message with param [/:conversationId]", () => {
        it("Harus mengembalikan status_code 200 dan array yang berisi kumpulan pesan (teks atau file) antara pengirim dan penerima pesan", async () => {
            const conversationId = "randomid"
            const res = await app.request(`/message/${conversationId}`, {
                method: "GET",
                headers: new Headers({ Authorization: `Bearer ${token}` })
            })

            expect(res.status).toBe(200)
            const resBody = await res.json()
            expect(resBody).not.toBeNull()
        })
    })

    describe("GET /message/conversations with param [/:username]", () => {
        it("Harus mengembalikan status_code 200 dan array yang berisi kumpulan pesan (teks atau file) antara pengirim dan penerima pesan", async () => {
            const username = "Tumultuousma"
            const res = await app.request(
                `/message/conversations/${username}`,
                {
                    method: "GET",
                    headers: new Headers({ Authorization: `Bearer ${token}` })
                }
            )

            expect(res.status).toBe(200)
            const resBody = await res.json()
            expect(resBody).not.toBeNull()
        })
    })

    describe("POST /message", () => {
        it("Harus mengembalikan status_code 400 bahwa data pesan yang dikirimkan tidak valid", async () => {
            const reqBody = {
                sellerId: "",
                buyerId: "",
                senderUsername: "Irritatingbo",
                senderPicture: "https://picsum.photos/seed/sQFhVl2/640/480",
                receiverUsername: "Tumultuousma",
                receiverEmail: "consuelo_reichel29@hotmail.com",
                receiverPicture: "https://picsum.photos/seed/1WZ2zZ/640/480",
                body: "Hi, I need fullstack developer freelancer and I'm interested in your portfolio, would you talk more about it?"
            }

            const res = await app.request("/message", {
                method: "POST",
                headers: new Headers({
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }),
                body: JSON.stringify(reqBody)
            })

            expect(res.status).toBe(400)
            const resJson = await res.json()
            expect(resJson).not.toBeNull()
            expect(Object.keys(resJson)).toEqual([
                "message",
                "statusCode",
                "status",
                "comingFrom"
            ])
            expect(resJson.message).not.toBeNull()
        })
    })

    describe("PUT /message/offer", () => {
        it("Harus mengembalikan status_code 404 bahwa data pesan yang ingin diubah tidak ditemukan pada database", async () => {
            const reqBody = {
                messageId: "6644215d6fdffcf6c3a6d8bc",
                type: "accepted"
            }

            const res = await app.request("/message/offer", {
                method: "PUT",
                headers: new Headers({
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }),
                body: JSON.stringify(reqBody)
            })

            expect(res.status).toBe(404)
            const resJson = await res.json()
            expect(resJson).not.toBeNull()
            expect(Object.keys(resJson)).toEqual(["message"])
            expect(resJson.message).not.toBeNull()
        })
    })

    describe("PUT /message/mark-as-read", () => {
        it("Harus mengembalikan status_code 404 bahwa data pesan yang ingin diubah tidak ditemukan pada database", async () => {
            const reqBody = {
                messageId: "6644215d6fdffcf6c3a6d8bc"
            }

            const res = await app.request("/message/mark-as-read", {
                method: "PUT",
                headers: new Headers({
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }),
                body: JSON.stringify(reqBody)
            })

            expect(res.status).toBe(404)
            const resJson = await res.json()
            expect(resJson).not.toBeNull()
            expect(Object.keys(resJson)).toEqual(["message"])
            expect(resJson.message).not.toBeNull()
        })
    })

    describe("PUT /message/mark-multiple-as-read", () => {
        it("Harus mengembalikan status_code 404 bahwa data-data pesan yang ingin diubah tidak ditemukan pada database", async () => {
            const reqBody = {
                messageId: "6644215d6fdffcf6c3a6d8bc",
                senderUsername: "Tumultuousma",
                receiverUsername: "Tumultuousma"
            }

            const res = await app.request("/message/mark-multiple-as-read", {
                method: "PUT",
                headers: new Headers({
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }),
                body: JSON.stringify(reqBody)
            })

            expect(res.status).toBe(404)
            const resJson = await res.json()
            expect(resJson).not.toBeNull()
            expect(Object.keys(resJson)).toEqual(["message"])
            expect(resJson.message).not.toBeNull()
        })
    })
})
