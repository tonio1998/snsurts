import {ActivityIndicator} from "react-native";
import {CText} from "./common/CText.tsx";

type AsyncValueProps = {
    value: any;
    formatter?: (v: any) => string;
    size?: 18 | 20 | 24 | 30 | 36 | 40 | 48 | 60 | 72 | 80 | 90 | 100 | 120 | 144 | 150 | 168 | 180 | 192 | 200 | 216 | 240 | 252 | 256 | 288 | 320 | 384 | 512 | 576 | 640 | 768 | 1024;
    color?: string;
    textStyle?: any;
};

export const AsyncValue = ({
                        value,
                        formatter,
                        size = 18,
                        color = '#fff',
                        textStyle,
                    }: AsyncValueProps) => {
    if (value === undefined || value === null) {
        return <ActivityIndicator size={size} color={color} />;
    }

    const displayValue = formatter ? formatter(value) : value;

    return (
        <CText style={textStyle}>
            {displayValue}
        </CText>
    );
};
