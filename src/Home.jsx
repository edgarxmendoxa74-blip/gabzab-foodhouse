import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import logo from './assets/logo_brand.jpg'
import heroImg from './assets/hero.jpg'
import FullDetailsModal from './FullDetailsModal'

function Home() {
    const [menuItems, setMenuItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cart, setCart] = useState([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [filter, setFilter] = useState('All')
    const [checkoutStep, setCheckoutStep] = useState('cart') // cart, shipping, success
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [orderType, setOrderType] = useState('delivery')
    const [paymentMethod, setPaymentMethod] = useState('cod')
    const [lastOrder, setLastOrder] = useState(null)

    useEffect(() => {
        fetchMenuItems()
    }, [])

    const MESSENGER_ID = "100064311721918"

    const handleMessengerRedirect = (e) => {
        if (e) e.preventDefault();
        const mMeUrl = `https://m.me/${MESSENGER_ID}`;

        // Detect iOS and Facebook In-App Browser
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isFBApp = /FBAV|FBAN/.test(navigator.userAgent);

        if (isIOS || isFBApp) {
            // Mobile iOS and FB In-App browser handle location.assign much better than window.open
            window.location.assign(mMeUrl);
        } else {
            // On Desktop/Android, try to open in new tab
            const win = window.open(mMeUrl, '_blank', 'noopener,noreferrer');
            if (!win || win.closed || typeof win.closed === 'undefined') {
                // If blocked by popup blocker, use same window
                window.location.assign(mMeUrl);
            }
        }
    };

    const fetchMenuItems = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setMenuItems(data || [])
        } catch (err) {
            console.error('Error fetching menu items:', err.message)
            setError('Failed to load menu. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    const addToCart = (item) => {
        const quantityToAdd = item.quantity || 1
        const existingItem = cart.find(cartItem => cartItem.id === item.id)
        if (existingItem) {
            setCart(cart.map(cartItem =>
                cartItem.id === item.id
                    ? { ...cartItem, quantity: (cartItem.quantity || 1) + quantityToAdd }
                    : cartItem
            ))
            setIsCartOpen(true)
        } else {
            setCart([...cart, { ...item, quantity: quantityToAdd }])
            setIsCartOpen(true)
            setCheckoutStep('cart')
        }
    }

    const updateQuantity = (id, change) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQuantity = (item.quantity || 1) + change
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
            }
            return item
        }))
    }

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id))
    }


    const handleCheckout = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const orderData = {
            full_name: formData.get('fullName'),
            email: 'guest@midnightcanteen.com',
            phone: formData.get('phone'),
            address: (orderType === 'delivery' || orderType === 'pickup')
                ? `${formData.get('address') || 'N/A'} ${formData.get('location') ? `(Landmark: ${formData.get('location')})` : ''}`
                : 'Dine In',
            order_type: orderType,
            table_number: orderType === 'dine-in' ? formData.get('tableNumber') : null,
            payment_method: paymentMethod,
            total_amount: cartTotal,
            items: cart,
            status: 'pending'
        }

        const summary = `✨ *NEW ORDER - THE MIDNIGHT CANTEEN* ✨\n\n` +
            `👤 *Customer:* ${orderData.full_name}\n` +
            `📱 *Phone:* ${orderData.phone}\n` +
            `🔖 *Type:* ${orderData.order_type.toUpperCase()}\n` +
            ((orderData.order_type === 'delivery' || orderData.order_type === 'pickup') ? `🏡 *Note/Address:* ${orderData.address}\n` : `🍽️ *Table:* ${orderData.table_number}\n`) +
            `💳 *Payment:* ${orderData.payment_method.toUpperCase()}\n\n` +
            `🛒 *ITEMS:*\n${orderData.items.map(i => `🍗 ${i.quantity || 1}x ${i.customTitle || i.title}`).join('\n')}\n\n` +
            `💰 *TOTAL AMOUNT: ₱${orderData.total_amount.toLocaleString()}`;

        try {
            setIsSubmitting(true)
            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single()

            if (error) throw error

            setLastOrder({ ...data, summary }) // Store summary too
            setCheckoutStep('success')
            setCart([])

            // Try to auto-copy if possible (though browser might block it here)
            try {
                navigator.clipboard.writeText(summary);
            } catch (err) {
                console.log('Auto-copy failed, user can copy via button');
            }
        } catch (err) {
            alert('Error processing order: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredItems = menuItems.filter(p => {
        const matchesCategory = filter === 'All' || p.category === filter
        return matchesCategory
    })

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)

    return (
        <div className="home">
            {/* Top Banner */}
            <div className="top-banner">
                📍 Purok Adelfa, Poblacion North, San Fernando, Philippines | 📞 0936 908 7295 | 🕒 4PM - 12AM
            </div>

            {/* Navbar */}
            <nav className="navbar">
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div className="brand" style={{ display: 'flex', alignItems: 'center' }}>
                        <img src={logo} alt="The Midnight Canteen Logo" style={{ height: '45px', width: '45px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--accent)' }} />
                    </div>
                    <button className="cart-icon" onClick={() => { setIsCartOpen(true); setCheckoutStep('cart') }}>
                        🛒 <span className="cart-count">{cart.length}</span>
                    </button>
                </div>
            </nav>
            <div className="sub-header" style={{ position: 'sticky', top: '90px', zIndex: 999, backgroundColor: 'var(--glass-midnight)', padding: '1rem 0', borderBottom: '1px solid var(--border-light)', backdropFilter: 'blur(10px)' }}>
                {/* Categories Slider */}
                <div className="container" style={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: '0.8rem',
                    whiteSpace: 'nowrap',
                    paddingBottom: '5px',
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none'  /* IE 10+ */
                }}>
                    {/* Hide scrollbar for Chrome/Safari/Opera */}
                    <style>{`
                       .container::-webkit-scrollbar { 
                           display: none; 
                       }
                   `}</style>
                    {['All', 'Wings Series', 'Silog Series', 'Noodles', 'Classic Milktea Series', 'Fruit Tea Series', 'Refreshers', 'Platters'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => {
                                setFilter(cat);
                                document.getElementById('menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`category-btn ${filter === cat ? 'active' : ''}`}
                            style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', flexShrink: 0 }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>


            {/* Menu Section */}
            <section className="gallery-section" id="menu">
                <div className="container">
                    <div className="section-title" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 className="logo-branding" style={{ fontSize: '3.5rem', marginBottom: '1rem', display: 'block' }}>Our Menu</h2>
                        <p style={{ fontFamily: 'Alfa Slab One, serif', fontSize: '1.2rem', color: 'var(--c-gold)', letterSpacing: '1px', textShadow: '2px 2px 0px #000' }}>
                            CRAVE FULFILLED, RIGHT AT YOUR DOORSTEP! 🍴👋
                        </p>
                        <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', marginTop: '0.8rem', fontWeight: '500' }}>
                            Book your orders now and satisfy your cravings! 📦
                        </p>
                    </div>


                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '5rem' }}>
                            <div className="loader">Preparing Delicious Food...</div>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--c-gold)' }}>
                            <p>{error}</p>
                            <button onClick={fetchMenuItems} style={{ marginTop: '1rem', textDecoration: 'underline' }}>Try Again</button>
                        </div>
                    ) : (
                        <>
                            <div className="gallery-grid">
                                {filteredItems.map(item => (
                                    <div key={item.id} className="painting-card">
                                        <div className="painting-image-container">
                                            <img src={item.image} alt={item.title} className="painting-image" />
                                        </div>
                                        <div className="painting-info">
                                            <h3 className="painting-title">{item.title}</h3>
                                            <p className="item-description-short">{item.description || 'Deliciously prepared with our signature recipe.'}</p>
                                            <p className="painting-price">₱{Number(item.price).toLocaleString()}</p>
                                            <button
                                                className="btn-view-details"
                                                onClick={() => {
                                                    setSelectedItem(item)
                                                    setIsModalOpen(true)
                                                }}
                                                style={{ marginTop: '1rem', background: 'var(--c-gold)', color: 'var(--c-midnight)', fontWeight: '700', border: 'none' }}
                                            >
                                                Customize
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '2rem 0', backgroundColor: '#0a0a0c', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                </div>
            </footer>

            {/* Cart Panel Shell */}
            <div className={`cart-panel ${isCartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h3>{checkoutStep === 'cart' ? 'Your Order' : checkoutStep === 'success' ? 'Final Step' : 'Order Details'}</h3>
                    <button onClick={() => setIsCartOpen(false)} style={{ fontSize: '1.5rem' }}>&times;</button>
                </div>

                {checkoutStep === 'cart' && (
                    <>
                        <div className="cart-items">
                            {cart.length === 0 ? (
                                <p style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-light)' }}>Your order list is empty.</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <img src={item.image} alt={item.title} className="cart-item-img" />
                                        <div className="cart-item-details">
                                            <h4>{item.customTitle || item.title}</h4>
                                            <p>₱{Number(item.price).toLocaleString()}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem', borderRadius: '4px' }}>
                                                    <button onClick={() => updateQuantity(item.id, -1)} style={{ color: 'white', fontSize: '1rem', width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                                    <span style={{ fontWeight: 'bold' }}>{item.quantity || 1}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} style={{ color: 'white', fontSize: '1rem', width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--c-gold)', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div className="cart-footer">
                                <div className="cart-total">
                                    <span>Total</span>
                                    <span>₱{cartTotal.toLocaleString()}</span>
                                </div>
                                <button className="btn-primary" style={{ width: '100%' }} onClick={() => setCheckoutStep('shipping')}>Proceed to Checkout</button>
                            </div>
                        )}
                    </>
                )}

                {checkoutStep === 'shipping' && (
                    <div className="cart-items">
                        <form className="checkout-form" onSubmit={handleCheckout}>
                            <div className="form-group">
                                <label>Order Type</label>
                                <select
                                    name="orderType"
                                    value={orderType}
                                    onChange={(e) => setOrderType(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--c-gold)', background: 'var(--glass-midnight)', color: 'white' }}
                                >
                                    <option value="delivery">🚀 Delivery</option>
                                    <option value="pickup">🛍️ Pickup</option>
                                    <option value="dine-in">🍽️ Dine In</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Full Name</label>
                                <input name="fullName" type="text" required placeholder="Your Name" />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input name="phone" type="tel" required placeholder="e.g. 09123456789" />
                            </div>


                            {(orderType === 'delivery' || orderType === 'pickup') ? (
                                <>
                                    <div className="form-group">
                                        <label>{orderType === 'delivery' ? 'Delivery Address' : 'Pickup Instructions'}</label>
                                        <textarea
                                            name="address"
                                            required
                                            placeholder={orderType === 'delivery' ? "House No., Street, Brgy., City" : "Note for pickup (e.g. Pickup at 6PM)"}
                                            rows="3"
                                        ></textarea>
                                    </div>
                                    {orderType === 'delivery' && (
                                        <div className="form-group">
                                            <label>Location / Landmark</label>
                                            <input name="location" type="text" placeholder="e.g. Blue Gate, Near Chapel, etc." />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="form-group">
                                    <label>Table Number</label>
                                    <input name="tableNumber" type="text" required placeholder="e.g. Table 5" />
                                </div>
                            )}

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label>Payment Method</label>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <button
                                        type="button"
                                        className={`category-btn ${paymentMethod === 'cod' ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod('cod')}
                                        style={{ flex: 1 }}
                                    >
                                        💵 COD
                                    </button>
                                    <button
                                        type="button"
                                        className={`category-btn ${paymentMethod === 'gcash' ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod('gcash')}
                                        style={{ flex: 1 }}
                                    >
                                        📱 GCash
                                    </button>
                                </div>
                            </div>

                            {paymentMethod === 'gcash' && (
                                <div style={{ textAlign: 'center', marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--c-gold)', marginBottom: '1rem' }}>Scan QR and Send Screenshot to Messenger</p>
                                    <img src="/gcash_qr.jpg" alt="GCash QR Code" style={{ width: '100%', maxWidth: '200px', borderRadius: '10px' }} />
                                </div>
                            )}

                            <div className="cart-total" style={{ marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
                                <span>Total Amount</span>
                                <span>₱{cartTotal.toLocaleString()}</span>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', marginTop: '1rem', background: '#0084FF' }}>
                                {isSubmitting ? 'Processing...' : '🚀 Submit & Message Us'}
                            </button>
                            <p style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '0.5rem', color: 'var(--text-light)' }}>
                                Clicking "Submit" will save your order and prepare it for Messenger.
                            </p>
                            <button type="button" onClick={() => setCheckoutStep('cart')} style={{ width: '100%', marginTop: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', textDecoration: 'underline' }}>
                                Back to Cart
                            </button>
                        </form>
                    </div>
                )}

                {checkoutStep === 'success' && (
                    <div className="cart-items" style={{ textAlign: 'center', paddingTop: '1rem' }}>
                        <div style={{ fontSize: '3rem', color: 'var(--c-gold)', marginBottom: '1rem' }}>💬</div>
                        <h2 style={{ fontSize: '1.8rem' }}>Direct Order via Messenger</h2>
                        <p style={{ color: 'var(--text-light)', marginTop: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>
                            All order details are sent directly to our Messenger to process your order immediately.
                        </p>

                        {lastOrder && (
                            <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'left', border: '2px solid #0084FF' }}>
                                <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: 'var(--c-gold)', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Action Required</h4>
                                    <p style={{ fontSize: '0.85rem', color: '#fff' }}>Please <b>Copy Details</b> and then <b>Open Messenger</b> to paste them to us.</p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <button
                                        className="btn-primary"
                                        style={{ width: '100%', background: 'var(--c-gold)', color: 'var(--c-midnight)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', borderRadius: '8px', padding: '1rem' }}
                                        onClick={(e) => {
                                            const btn = e.currentTarget;
                                            const originalText = '📋 1. Copy Order Details';

                                            navigator.clipboard.writeText(lastOrder.summary).then(() => {
                                                btn.innerHTML = '✅ Order Copied!';
                                                setTimeout(() => {
                                                    btn.innerHTML = originalText;
                                                }, 2000);
                                            }).catch(err => {
                                                console.error('Failed to copy', err);
                                                alert('Failed to copy. Please manually highlight and copy the summary.');
                                            });
                                        }}
                                    >
                                        📋 1. Copy Order Details
                                    </button>

                                    <button
                                        onClick={handleMessengerRedirect}
                                        className="btn-primary"
                                        style={{ width: '100%', background: '#0084FF', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', cursor: 'pointer', border: 'none', borderRadius: '8px', padding: '1rem' }}
                                    >
                                        💬 2. Open Messenger to Paste
                                    </button>
                                </div>

                                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}><b>Preview of Details:</b></p>
                                    <pre style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '4px', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>
                                        {lastOrder.summary}
                                    </pre>
                                </div>
                            </div>
                        )}

                        <button
                            className="btn-secondary"
                            style={{ marginTop: '1.5rem', width: '100%', border: 'none' }}
                            onClick={() => { setIsCartOpen(false); setLastOrder(null); setCheckoutStep('cart'); }}
                        >
                            Return to Menu
                        </button>
                    </div>
                )}
            </div>

            {/* Overlay for Cart */}
            {
                isCartOpen && (
                    <div
                        onClick={() => setIsCartOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            zIndex: 1999,
                        }}
                    ></div>
                )
            }

            {/* Full Details Modal */}
            <FullDetailsModal
                painting={selectedItem}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                addToCart={addToCart}
            />
        </div >
    )
}

export default Home
