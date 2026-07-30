import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Scale, Loader2, User, Building2, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ACCOUNT_TYPES = [
    {
        value: 'independent_advocate',
        label: 'Independent Advocate',
        icon: User,
        description: 'Solo practitioner managing your own cases and clients.',
    },
    {
        value: 'law_firm_admin',
        label: 'Law Firm Admin',
        icon: Building2,
        description: 'Create and manage a firm, invite associates, and oversee all cases.',
    },
    {
        value: 'associate',
        label: 'Associate',
        icon: Users,
        description: 'Work under a law firm. Register here, then ask your firm admin to link you.',
    },
];

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        accountType: 'independent_advocate',
        firmName: '',
        barNumber: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const selectedType = ACCOUNT_TYPES.find(t => t.value === formData.accountType);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const { confirmPassword, ...userData } = formData;
            await register(userData);
            navigate('/Dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

            <Card className="w-full max-w-md relative z-10 shadow-2xl border-0">
                <CardHeader className="space-y-4 pb-4">
                    <div className="flex items-center justify-center gap-3">
                        <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                            <Scale className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div className="text-center">
                        <CardTitle className="text-2xl font-bold text-slate-900">Create Account</CardTitle>
                        <CardDescription className="text-slate-500 mt-1">
                            Join Inkit Legal Management
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Account Type */}
                        <div className="space-y-2">
                            <Label htmlFor="accountType">Account Type</Label>
                            <Select
                                value={formData.accountType}
                                onValueChange={(value) => handleChange('accountType', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ACCOUNT_TYPES.map(t => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Contextual hint */}
                            {selectedType && (
                                <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border text-sm text-slate-600">
                                    <selectedType.icon className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                                    <span>{selectedType.description}</span>
                                </div>
                            )}
                        </div>

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="Adv. John Doe"
                                value={formData.fullName}
                                onChange={(e) => handleChange('fullName', e.target.value)}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="advocate@example.com"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                required
                            />
                        </div>

                        {/* Password + Confirm */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Firm Name — hidden for associates (they join via invite) */}
                        {formData.accountType !== 'associate' && (
                            <div className="space-y-2">
                                <Label htmlFor="firmName">
                                    {formData.accountType === 'law_firm_admin' ? 'Firm Name' : 'Practice Name'}
                                </Label>
                                <Input
                                    id="firmName"
                                    placeholder="Doe & Associates"
                                    value={formData.firmName}
                                    onChange={(e) => handleChange('firmName', e.target.value)}
                                />
                            </div>
                        )}

                        {/* Bar Number */}
                        <div className="space-y-2">
                            <Label htmlFor="barNumber">Bar Council Number (Optional)</Label>
                            <Input
                                id="barNumber"
                                placeholder="MH/1234/2020"
                                value={formData.barNumber}
                                onChange={(e) => handleChange('barNumber', e.target.value)}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-amber-600 hover:text-amber-700 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
