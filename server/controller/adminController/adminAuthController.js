const User = require('../../model/user/userModel')
const Category = require('../../model/admin/categoryModel')
const Brand=require('../../model/admin/brandModel')

const adminLogin = (req, res) => {
    res.render('admin/adminLogin')
}
const adminHome = (req, res) => {
    res.render('admin/adminIndex')
}
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
        // console.log('this categorys....',categorys);
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
        console.log('update category')
        const id = req.params.id;
        const { name, description } = req.body;

        console.log('this is the name of body:', name);
        console.log('this is the id :', id);
        const category = await Category.findByIdAndUpdate(id, { name, description }, { new: true });

        console.log('this is update categories...:', category);

        if (!category) {
            console.log('Category not found:', id);
            return res.status(404).json({ error: 'Category not found' });
        }

        console.log('Updated successfully:', category);
        res.status(200).json({ message: 'Updated successfully', category });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

//delete category
const deleteCategory = async (req, res) => {
    const id = req.params.id
    console.log('this is deleted id :', id);
    try {
        const category = await Category.findById(id)
        if (!category) {
            console.log('Category not found with id:', id)
            return res.status(404).json({ error: 'Category not found' })
        }

        console.log('category found :', category);

        await Category.findByIdAndDelete(id)
        console.log('category deleted successfuly');

        res.status(200).json({ message: 'Deleted successfully' })
    } catch (error) {
        console.log('error for deleting category', error)
        res.status(500).json({ error: 'faild to delete category' })
    }

}

//brands
const brand=async (req,res)=>{
    try {
        const brands = await Brand.find()
        // console.log('this categorys....',categorys);
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
        // const newBrand = new Brand({
        //     ...req.body,
        //     createdAt: new Date() 
        // });
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

        console.log('this is the name of body:', name);
        console.log('this is the id :', id);
        const brand = await Brand.findByIdAndUpdate(id, { name, description }, { new: true });

        console.log('this is update categories...:', brand);

        if (!brand) {
            console.log('brand not found:', id);
            return res.status(404).json({ error: 'brand not found' });
        }

        console.log('Updated successfully:', brand);
        res.status(200).json({ message: 'Updated successfully', brand });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

//delete brand
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
    deleteCategory,
    brand,
    checkBrand,
    addBrands,
    updateBrand,
    deleteBrand
}