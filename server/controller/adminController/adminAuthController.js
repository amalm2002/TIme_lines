const User = require('../../model/user/userModel')
const Category = require('../../model/admin/categoryModel')
const Brand=require('../../model/admin/brandModel')
const Order = require('../../model/user/orderModel')
const {getTopSellingProducts}=require('../../controller/adminController/dashboardChart')


const adminLogin = (req, res) => {
    res.render('admin/adminLogin')
}
// const adminHome = (req, res) => {
//     res.render('admin/adminIndex')
// }

const adminHome = async (req, res) => {
    try {
        const  {topSellingProducts,topSellingCategories,topSellingBrands}=await getTopSellingProducts()
        const safeTopSellingProducts = Array.isArray(topSellingProducts) ? topSellingProducts : [];
        const safeTopSellingCategories = Array.isArray(topSellingCategories) ? topSellingCategories : [];
        const safeTopSellingBrands = Array.isArray(topSellingBrands) ? topSellingBrands : [];
        
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todaysOrders = await Order.find({
            dateOrdered: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        const chartData = {
            totalOrders: todaysOrders.length,
            totalAmount: todaysOrders.reduce((sum, order) => sum + order.totalPrice, 0),
            orderStatus: {
                pending: 0,
                completed: 0,
                cancelled: 0,
                delivered: 0,
            }
        };

        todaysOrders.forEach(order => {
            if (order.status === 'Pending') chartData.orderStatus.pending++;
            if (order.status === 'Completed') chartData.orderStatus.completed++;
            if (order.status === 'Cancelled') chartData.orderStatus.cancelled++;
            if (order.status === 'Delivered') chartData.orderStatus.delivered++;
        });

        res.render('admin/adminIndex', { chartData,
            topSellingProducts: safeTopSellingProducts,
            topSellingCategories: safeTopSellingCategories ,
            topSellingBrands:safeTopSellingBrands
           });
    } catch (error) {
        console.error("Error retrieving today's orders:", error);
        res.status(500).send('Internal Server Error');
    }
};


//Admin login
const Login = async (req, res) => {
    let adminPass = process.env.ADMIN_PASS;
    let adminEmail = process.env.ADMIN_EMAIL;

    const { email, password } = req.body;
    console.log('this is req.body email and password:', email, password);

    try {
        if (adminEmail === email) {
            if (adminPass === password) {
                // admin session 
                req.session.admin = adminEmail

                return res.status(200).json({ message: 'redirecting....', redirectUrl: '/admin/adminHome' });
            } else {
                return res.status(400).json({ errorMessage: 'password incorrect, please check it!', fieldErrors: { password: true } });
            }
        } else {
            return res.status(400).json({ errorMessage: 'incorrect email, check out your email!', fieldErrors: { email: true } });
        }
    } catch (error) {
        console.error('admin login error', error);
        return res.status(500).json({ errorMessage: 'server error' });
    }
};

//users list
const customerList = async (req, res) => {
    try {
        const users = await User.find({})
        res.render('admin/customerList', { users })
    } catch (error) {
        console.error('error fetching user list :', error);
        res.status(500).json({ errorMessage: 'server error' })
    }
}


//users  status showing
const changeStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (status === 'Blocked') {
            user.isBlocked = true;
            user.status = 'Blocked';
            console.log('User blocked:', user);
        } else {
            user.isBlocked = false;
            user.status = 'Active';
            console.log('User unblocked:', user);
        }

        await user.save();
        res.json({ success: true, status: user.status });

    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

//category 
const category = async (req, res) => {
    try {
        const categorys = await Category.find()
        res.render('admin/category', { categorys })
    } catch (error) {
        console.error('error for category', error);
        res.status(500).json({ errorMessage: 'server error' })
    }
}


//check category if alredy exist or not
const checkCategory=async (req,res)=>{
    try {
        const category=await Category.findOne({name:req.query.name})
        if (category) {
            res.json({exists:true})
        }else{
            res.json({exists:false})
        }
    } catch (error) {
        console.error("checking category if exist or not error:",error);
        res.status(500).json({error:'sever error'})
        }
}


// Add category
const addCategory = async (req, res) => {
    try {

        const exisingsCategory=await Category.findOne({name:req.body.name})

        if (exisingsCategory) {
            return res.status(400).json({error:"category alredy exists"})
        }

        const newCategory = new Category(req.body);
        await newCategory.save();

        res.json({ newCategory });
    } catch (error) {
        console.error('Add category error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Edit category
const updateCategory = async (req, res) => {
    try {
        console.log('update category');
        const id = req.params.id;
        const { name, description } = req.body;

        const existingCategory = await Category.findOne({ name, _id: { $ne: id } });
        
        if (existingCategory) {
            return res.status(400).json({ error: "Category already exists" });
        }
        const category = await Category.findByIdAndUpdate(id, { name, description }, { new: true });
        
        if (!category) {
            console.log('Category not found:', id);
            return res.status(404).json({ error: 'Category not found' });
        }

        res.status(200).json({ message: 'Updated successfully', category });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


const updateCategoryStatus = async (req, res) => {
    const id = req.params.id;
    const { isBlocked } = req.body;

    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        category.isBlocked = isBlocked;
        category.status = isBlocked ? 'Blocked' : 'Active'; 
        await category.save();

        res.status(200).json({ message: `Category ${isBlocked ? 'blocked' : 'unblocked'} successfully` });
    } catch (error) {
        console.log('Error updating category status:', error);
        res.status(500).json({ error: 'Failed to update category status' });
    }
};



//brands
const brand=async (req,res)=>{
    try {
        const brands = await Brand.find()
        res.render('admin/brand', { brands })
    } catch (error) {
        console.error('error for category', error);
        res.status(500).json({ errorMessage: 'server error' })
    }
}

//check  if any existing barand
const checkBrand=async (req,res)=>{
    try {
        const brand=await Brand.findOne({name:req.query.name})
        if (brand) {
            res.json({exists:true})
        }else{
            res.json({exists:false})
        }
        
    } catch (error) {
        console.error('this error will showing on checking the brand existing or not:',error);
        res.status(500).json({error:"sever error"})
    }
}

//add brands
const addBrands=async (req,res)=>{
    try {
        const exisingsBrand=await Brand.findOne({name:req.body.name})

        if (exisingsBrand) {
            return res.status(400).json({error:"brand alredy exists"})
        }

        const newBrand=new Brand(req.body)
        await newBrand.save()

        res.json({newBrand})
    } catch (error) {
        console.error('this error will shoeing on add brands :',error);
        res.status(500).json({error:'server error'})
    }
}

// Edit brands
const updateBrand = async (req, res) => {


    try {
        console.log('update brand')
        const id = req.params.id;
        const { name, description } = req.body;

        const exisingsBrand=await Brand.findOne({name,_id:{$ne:id}})        
        if (exisingsBrand) {
            return res.status(400).json({ error: "Brand already exists" });
        }
        const brand = await Brand.findByIdAndUpdate(id, { name, description }, { new: true });

        if (!brand) {
            console.log('brand not found:', id);
            return res.status(404).json({ error: 'brand not found' });
        }
        res.status(200).json({ message: 'Updated successfully', brand });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// delete brand
const deleteBrand= async (req,res)=>{
    const id=req.params.id
    try {
        const brand=await Brand.findById(id)
        if (!brand) {
            res.status(404).json({error:'barand not found!'})
        }

        await Brand.findByIdAndDelete(id)

        res.status(200).json({message:'brand deleted successfuly..'})
        
    } catch (error) {
        console.error('this error showing on deleting brand',error);
        res.status(500).json({error:'server error'})
    }
}





const Logout = (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500)
        }
        res.redirect('/admin/adminLogin')
    })
}


module.exports = {
    adminHome,
    adminLogin,
    customerList,
    Login,
    Logout,
    changeStatus,
    category,
    checkCategory,
    addCategory,
    updateCategory,
    brand,
    checkBrand,
    addBrands,
    updateBrand,
    deleteBrand,
    updateCategoryStatus
}