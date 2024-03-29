import Orders from '@models/orderModel'
import Products from '@models/productModel'
import auth from '@middleware/auth'


export default async (req, res) => {
    switch(req.method){
        case "POST":
            await createOrder(req, res)
            break;
        case "GET":
            await getOrders(req, res)
            break;
    }
}

const getOrders = async (req, res) => {
    try {
        const result = await auth(req, res)
        console.log(result);
        let orders;
        if(result.role !== 'admin'){
            orders = await Orders.find({user: result.id}).populate("user", "-password")
        }else{
            orders = await Orders.find().populate("user", "-password")
        }

        res.json({orders})
    } catch (err) {
        console.log(err);
        return res.status(500).json({err: 'Sorry. Please Login Again or Contact Us!'})
    }
}

const createOrder = async (req, res) => {
    try {
        const result = await auth(req, res)
        const { address, mobile, cart, total } = req.body

        const newOrder = new Orders({
            user: result.id, address, mobile, cart, total
        })

        cart.filter(item => {
            return sold(item._id, item.quantity, item.inStock, item.sold)
        })

        await newOrder.save()

        res.json({
            msg: 'Thank you for shopping with us! We will contact you to confirm the order.',
            newOrder
        })

    } catch (err) {
        return res.status(500).json({err: 'Sorry. Please Login Again or Contact Us!'})
    }
}

const sold = async (id, quantity, oldInStock, oldSold) => {
    await Products.findOneAndUpdate({_id: id}, {
        inStock: oldInStock - quantity,
        sold: quantity + oldSold
    })
}