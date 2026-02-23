namespace RadioPlanner.Services;

public static class IdHelper
{
    private const string Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    public static string NewId(int size = 8)
    {
        var bytes = new byte[size];
        System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
        return new string(bytes.Select(b => Chars[b % Chars.Length]).ToArray());
    }
}
